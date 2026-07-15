const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const mailService = require('../utils/mailService');

const createTask = async (req, res, next) => {
    const { project, title, description, assignedTo, duration, priority, status, dueDate, labels } = req.body;

    try {
        if (!project || !title) {
            res.status(400);
            throw new Error('Please provide required task fields');
        }

        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            res.status(404);
            throw new Error('Project not found');
        }

        const memberEntry = projectDoc.members.find((m) => m.user.toString() === req.user._id.toString());
        const isProjectLeader = projectDoc.owner.toString() === req.user._id.toString() || (memberEntry && memberEntry.role === 'project_leader');

        if (!isProjectLeader) {
            res.status(403);
            throw new Error('Only project leaders can create tasks');
        }

        const task = await Task.create({
            project,
            title,
            description: description || '',
            assignedTo: assignedTo || null,
            duration: duration || 0,
            priority: priority || 'Medium',
            status: status || 'To Do',
            dueDate: dueDate || null,
            labels: Array.isArray(labels) ? labels : [],
        });

        const populated = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar');

        const io = req.app.get('io');
        io.to(`project:${project}`).emit('task:created', populated);

        await ActivityLog.create({
            user: req.user._id,
            action: 'Created task',
            project,
            task: task._id,
            description: `${req.user.name} created task "${title}" in ${projectDoc.name}`,
        });

        if (assignedTo) {
            const assignedUser = await User.findById(assignedTo);
            if (assignedUser) {
                const notification = await Notification.create({
                    recipient: assignedUser._id,
                    sender: req.user._id,
                    type: 'task_assigned',
                    title: `New task assigned: ${title}`,
                    message: `${req.user.name} assigned you to the task "${title}" in project ${projectDoc.name}.`,
                    link: `/tasks`,
                });
                io.to(`user:${assignedUser._id}`).emit('notification:new', notification);
                mailService.sendTaskAssignedEmail(assignedUser.email, assignedUser.name, title, projectDoc.name, req.user.name).catch((e) => console.error('Task assigned email failed:', e.message));
            }
        }

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

const getTasks = async (req, res, next) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },
                { 'members.user': req.user._id },
            ],
        }).select('_id');

        const projectIds = projects.map((project) => project._id);

        const tasks = await Task.find({
            $or: [
                { project: { $in: projectIds } },
                { assignedTo: req.user._id },
            ],
        })
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        next(error);
    }
};

const updateTaskStatus = async (req, res, next) => {
    const { status } = req.body;
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }
        const projectDoc = await Project.findById(task.project).select('name');
        task.status = status;
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar');

        const io = req.app.get('io');
        io.to(`project:${task.project}`).emit('task:updated', populated);

        await ActivityLog.create({
            user: req.user._id,
            action: 'Changed task status',
            project: task.project,
            task: task._id,
            description: `${req.user.name} changed "${task.title}" to ${status}`,
        });

        if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
            const assignedUser = await User.findById(task.assignedTo);
            if (assignedUser) {
                const notif = await Notification.create({
                    recipient: assignedUser._id,
                    sender: req.user._id,
                    type: 'status_change',
                    title: `Task status changed: ${task.title}`,
                    message: `${req.user.name} changed "${task.title}" to ${status} in ${projectDoc?.name || 'the project'}.`,
                    link: `/tasks`,
                });
                io.to(`user:${assignedUser._id}`).emit('notification:new', notif);
                if (status === 'Done') {
                    mailService.sendTaskStatusEmail(assignedUser.email, assignedUser.name, task.title, projectDoc.name, status, req.user.name).catch((e) => console.error('Task status email failed:', e.message));
                }
            }
        }

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    const { title, description, assignedTo, duration, priority, status, dueDate, labels } = req.body;

    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        const projectDoc = await Project.findById(task.project);
        const memberEntry = projectDoc.members.find((m) => m.user.toString() === req.user._id.toString());
        const isProjectLeader = projectDoc.owner.toString() === req.user._id.toString() ||
            (memberEntry && memberEntry.role === 'project_leader');

        if (assignedTo !== undefined && !isProjectLeader) {
            res.status(403);
            throw new Error('Only project leaders can reassign tasks');
        }

        const previousAssignee = task.assignedTo?.toString();

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
        if (duration !== undefined) task.duration = duration;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;
        if (dueDate !== undefined) task.dueDate = dueDate || null;
        if (labels !== undefined) task.labels = Array.isArray(labels) ? labels : [];

        await task.save();

        const populated = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar');

        const io = req.app.get('io');
        io.to(`project:${task.project}`).emit('task:updated', populated);

        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated task',
            project: task.project,
            task: task._id,
            description: `${req.user.name} updated task "${task.title}"`,
        });

        if (assignedTo && assignedTo !== previousAssignee) {
            const assignedUser = await User.findById(assignedTo);
            if (assignedUser) {
                const notification = await Notification.create({
                    recipient: assignedUser._id,
                    sender: req.user._id,
                    type: 'task_assigned',
                    title: `Task assigned to you: ${task.title}`,
                    message: `${req.user.name} assigned you to the task "${task.title}" in project ${projectDoc.name}.`,
                    link: `/tasks`,
                });
                io.to(`user:${assignedUser._id}`).emit('notification:new', notification);
                mailService.sendTaskAssignedEmail(assignedUser.email, assignedUser.name, task.title, projectDoc.name, req.user.name).catch((e) => console.error('Task reassign email failed:', e.message));
            }
        }

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTaskStatus,
    updateTask,
};
