const nodemailer = require('nodemailer');

// Helper to create transport — tries Gmail → generic SMTP → Ethereal (dev fallback)
const getTransporter = async () => {
  // ── 1. Gmail via App Password (recommended for real email delivery) ──────
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const t = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    t._isGmail = true;
    t._senderEmail = process.env.GMAIL_USER;
    console.log(`[MailService] Using Gmail SMTP (${process.env.GMAIL_USER})`);
    return t;
  }

  // ── 2. Generic SMTP (e.g. SendGrid, Mailgun, custom host) ────────────────
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    t._senderEmail = process.env.SMTP_USER;
    return t;
  }

  // ── 3. Ethereal (mock — dev only, NOT delivered to real inboxes) ──────────
  try {
    const testAccount = await nodemailer.createTestAccount();
    const t = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    t._isEthereal = true;
    t._senderEmail = 'no-reply@taskflow.com';
    console.warn('[MailService] ⚠️  No GMAIL_USER/GMAIL_APP_PASSWORD set — using Ethereal mock (emails will NOT reach real inboxes)');
    return t;
  } catch (error) {
    console.error('[MailService] Failed to create Ethereal fallback:', error.message);
    return null;
  }
};

// Helper: resolve the from address
const fromAddress = (label, t) =>
  `"${label}" <${t._senderEmail || 'no-reply@taskflow.com'}>`;


// Send OTP Email
const sendOtpEmail = async (email, otp, purpose) => {
  const subject = purpose === 'register' ? 'Verify your TaskFlow Account' : 'TaskFlow OTP Sign In';
  const headerText = purpose === 'register' ? 'Verify Your Registration' : 'Your Sign-In OTP';
  const explanation = purpose === 'register'
    ? 'Thank you for choosing TaskFlow. Use the verification code below to complete your registration:'
    : 'Use the verification code below to securely access your TaskFlow account:';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a; text-align: center;">${headerText}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px; text-align: center;">${explanation}</p>
      <div style="background-color: #f0fdf4; border: 1px dashed #bbf7d0; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #15803d; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const transporter = await getTransporter();
  let info = null;
  if (transporter) {
    try {
      info = await transporter.sendMail({
        from: fromAddress('TaskFlow Security', transporter),
        to: email,
        subject,
        html: htmlContent,
        text: `${headerText}\n\n${explanation}\n\nCode: ${otp}\n\nValid for 5 minutes.`,
      });

      if (transporter._isEthereal) {
        console.log('\n======================================================');
        console.log(`📧  Mock Email Sent to ${email} (OTP Code: ${otp})`);
        console.log(`🔗  Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Mail sending failed, falling back to console log:', e.message);
    }
  }

  console.log('\n=================== TASKFLOW MAIL OTP REPORT ===================');
  console.log(`| Target User: ${email}`);
  console.log(`| Purpose:     ${purpose.toUpperCase()} VERIFICATION`);
  console.log(`| OTP Code:    ${otp}`);
  console.log(`| Message:     Valid for 5 minutes. Please verify code in website.`);
  console.log('=================================================================\n');

  return info;
};

// Send Welcome/Confirmation Email
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to TaskFlow!';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a;">Welcome to the Flow, ${name}! 🎉</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        We are thrilled to welcome you to **TaskFlow**. Your account has been verified successfully.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Here are a few quick things you can do to get started:
      </p>
      <ul style="font-size: 14px; line-height: 1.6; color: #475569; padding-left: 20px; margin-bottom: 25px;">
        <li style="margin-bottom: 8px;">Create or join team workspaces</li>
        <li style="margin-bottom: 8px;">Organize tasks using interactive Kanban boards</li>
        <li style="margin-bottom: 8px;">Set up deadlines and assign project goals</li>
      </ul>
      <div style="text-align: center; margin-bottom: 15px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">Go to Workspace</a>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        © TaskFlow Inc. Organize everything.
      </p>
    </div>
  `;

  const transporter = await getTransporter();
  let info = null;
  if (transporter) {
    try {
      info = await transporter.sendMail({
        from: fromAddress('TaskFlow Welcome', transporter),
        to: email,
        subject,
        html: htmlContent,
        text: `Welcome to TaskFlow, ${name}!\n\nYour account has been verified and registered successfully.`,
      });

      if (transporter._isEthereal) {
        console.log('\n======================================================');
        console.log(`📧  Mock Welcome Email Sent to ${email}`);
        console.log(`🔗  Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Welcome mail sending failed, falling back to console log:', e.message);
    }
  }

  console.log('\n================= TASKFLOW WELCOME MAIL REPORT =================');
  console.log(`| Target User: ${email}`);
  console.log(`| Name:        ${name}`);
  console.log(`| Message:     Welcome to TaskFlow! Account successfully created.`);
  console.log('=================================================================\n');

  return info;
};

// Send Project Invitation Email
const sendProjectInviteEmail = async (email, inviterName, projectName) => {
  const subject = `You've been invited to join ${projectName} on TaskFlow`;
  const registerUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?email=${encodeURIComponent(email)}&project=${encodeURIComponent(projectName)}&inviter=${encodeURIComponent(inviterName)}`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a; text-align: center;">Workspace Invitation</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
        Hello,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
        <strong>${inviterName}</strong> has invited you to collaborate on the project <strong>${projectName}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
        If you already have a TaskFlow account, simply log in to view the project dashboard. If you don't have an account yet, click the link below to sign up and get started:
      </p>
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${registerUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">Accept Invitation & Register</a>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        This email was sent by TaskFlow Project Workspace on behalf of ${inviterName}.
      </p>
    </div>
  `;

  const transporter = await getTransporter();
  let info = null;
  if (transporter) {
    try {
      info = await transporter.sendMail({
        from: fromAddress('TaskFlow Invitations', transporter),
        to: email,
        subject,
        html: htmlContent,
        text: `Hello!\n\n${inviterName} has invited you to collaborate on the project "${projectName}" on TaskFlow.\n\nSign up and accept the invite here: ${registerUrl}`,
      });

      if (transporter._isEthereal) {
        console.log('\n======================================================');
        console.log(`📧  Mock Invite Email Sent to ${email} (Project: ${projectName})`);
        console.log(`🔗  Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Invite mail sending failed, falling back to console log:', e.message);
    }
  }

  console.log('\n================ TASKFLOW INVITE MAIL REPORT ================');
  console.log(`| Invited User: ${email}`);
  console.log(`| Inviter:      ${inviterName}`);
  console.log(`| Project Name: ${projectName}`);
  console.log(`| Message:     Successfully invited user to project workspace.`);
  console.log('=============================================================\n');

  return info;
};

// Send Password Reset OTP Email
const sendPasswordResetEmail = async (email, otp) => {
  const subject = 'Reset Your TaskFlow Password';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a; text-align: center;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px; text-align: center;">
        We received a request to reset your TaskFlow account password. Use the code below to continue:
      </p>
      <div style="background-color: #fff7ed; border: 1px dashed #fed7aa; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #c2410c; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b; text-align: center; margin-bottom: 20px;">
        This code expires in <strong>5 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        © TaskFlow Inc. Organize everything.
      </p>
    </div>
  `;

  const transporter = await getTransporter();
  let info = null;
  if (transporter) {
    try {
      info = await transporter.sendMail({
        from: fromAddress('TaskFlow Security', transporter),
        to: email,
        subject,
        html: htmlContent,
        text: `Password Reset Request\n\nYour TaskFlow password reset code is: ${otp}\n\nThis code is valid for 5 minutes. If you did not request this, ignore this email.`,
      });

      if (transporter._isEthereal) {
        console.log('\n======================================================');
        console.log(`📧  Mock Password Reset Email Sent to ${email} (OTP Code: ${otp})`);
        console.log(`🔗  Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Password reset mail sending failed, falling back to console log:', e.message);
    }
  }

  console.log('\n================ TASKFLOW PASSWORD RESET REPORT ================');
  console.log(`| Target User: ${email}`);
  console.log(`| Purpose:     FORGOT PASSWORD`);
  console.log(`| OTP Code:    ${otp}`);
  console.log(`| Message:     Valid for 5 minutes. Use to reset password.`);
  console.log('=================================================================\n');

  return info;
};

// Send Task Assigned Email
const sendTaskAssignedEmail = async (email, name, taskTitle, projectName, assignerName) => {
  const subject = `New Task Assigned: ${taskTitle}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a;">New Task Assigned</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 10px;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        <strong>${assignerName}</strong> has assigned you a new task in <strong>${projectName}</strong>:
      </p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
        <p style="font-size: 16px; font-weight: 700; color: #15803d; margin: 0;">${taskTitle}</p>
      </div>
      <div style="text-align: center; margin-bottom: 15px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">View Task</a>
      </div>
    </div>`;
  return sendGenericEmail(email, subject, htmlContent);
};

// Send Task Status Changed Email
const sendTaskStatusEmail = async (email, name, taskTitle, projectName, newStatus, changerName) => {
  const subject = `Task Updated: ${taskTitle} → ${newStatus}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a;">Task Status Updated</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 10px;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        <strong>${changerName}</strong> updated the status of a task in <strong>${projectName}</strong>:
      </p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
        <p style="font-size: 16px; font-weight: 700; color: #15803d; margin: 0;">${taskTitle}</p>
      </div>
      <p style="font-size: 14px; color: #475569;">New status: <strong>${newStatus}</strong></p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">View on TaskFlow</a>
      </div>
    </div>`;
  return sendGenericEmail(email, subject, htmlContent);
};

// Send Project Created Email
const sendProjectCreatedEmail = async (email, name, projectName) => {
  const subject = `Project Created: ${projectName}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">TaskFlow</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #0f172a;">Project Created Successfully</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 10px;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Your new project <strong>${projectName}</strong> has been created successfully. You can now add team members and start assigning tasks.
      </p>
      <div style="text-align: center; margin-bottom: 15px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">Go to Project</a>
      </div>
    </div>`;
  return sendGenericEmail(email, subject, htmlContent);
};

// Generic send helper
const sendGenericEmail = async (email, subject, htmlContent) => {
  const transporter = await getTransporter();
  let info = null;
  if (transporter) {
    try {
      info = await transporter.sendMail({
        from: fromAddress('TaskFlow Notifications', transporter),
        to: email,
        subject,
        html: htmlContent,
      });
      if (transporter._isEthereal) {
        console.log(`\n📧  Notification Email Sent to ${email}`);
        console.log(`🔗  Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
      }
    } catch (e) {
      console.error('Notification mail sending failed:', e.message);
    }
  }
  console.log(`[Email Notification] ${subject} → ${email}`);
  return info;
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendProjectInviteEmail,
  sendPasswordResetEmail,
  sendTaskAssignedEmail,
  sendTaskStatusEmail,
  sendProjectCreatedEmail,
};
