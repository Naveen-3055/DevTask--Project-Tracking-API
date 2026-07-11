const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

const sendTaskAssignmentEmail = async ({toEmail, toName, taskTitle, projectName, assignedByName}) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: `you have been assigned a task : ${taskTitle}`,
        htm: `
        
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1E40AF;">New Task Assigned</h2>
            <p>Hi ${toName},</p>
            <p><strong>${assignedByName}</strong> has assigned you a task in <strong>${projectName}</strong>.</p>
            <div style="background: #F1F5F9; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #1E293B;">${taskTitle}</h3>
            </div>
            <p>Login to DevTask to view and update this task.</p>
            <p style="color: #64748B; font-size: 12px;">You are receiving this because you are a member of this organization.</p>
      </div>
        
        `,

    });
};

module.exports = { sendTaskAssignmentEmail};