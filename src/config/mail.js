import Mailgen from "mailgen";
import env from "./env.js"
import nodemailer from "nodemailer"
import AppError from "../utils/app-error.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, 
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

const sendMail = async(options)=>{

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Task Manager',
        link: env.BASE_URL
    }
  });

  const emailBody = mailGenerator.generate(options.mailGenContent);

  const emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  const mail = {
    from: env.SMTP_SEND,
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailBody
  };

  try{
    const info = await transporter.sendMail(mail)
    return info.messageId
  }
  catch(err){
    console.log("Error: ", err)
    throw new AppError(500,"Failed to send verification email.")
  }
}

const emailVerifyGenContent = (username, verificationURL)=>{
  return {
    body: {
      name: username,
      intro: "Welcome to App! We're very excited to have you on board.",
      action: {
        instructions: "To verify your email, Click here: ",
        button: {
          color: "#22BC66",
          text: "Verify your Email",
          link: verificationURL
        },
      },
      outro: "Need help or have questions? Just reply to this email, we'd love to help."
    }
  }
}

const passwordResetGenContent = (username, passwordResetURL)=>{
  return {
    body: {
      name: username,
      intro: "Welcome to App! We're very excited to have you on board.",
      action: {
        instructions: "To reset password, Click here: ",
        button: {
          color: "#22BC66",
          text: "Verify your Email",
          link: passwordResetURL
        },
      },
      outro: "If you did not request a password reset, no further action is required on your part."
    }
  }
}


// our call will look like this
// sendMail({
//   email: user.email,
//   mailGenContent: emailVerificationGenContent(
//     username: user.fullname,
//     verficationURL
//   )
//   subject: "To verify Email"
// })

export {
  sendMail,
  emailVerifyGenContent,
  passwordResetGenContent
}