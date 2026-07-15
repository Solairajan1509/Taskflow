const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For direct private messaging
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For group chats associated with a project/channel
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
