import { configs } from "./../configs";
const mailgun = require("mailgun-js")({
    apiKey: configs.MAILGUN_API_SECRET,
    domain: configs.MAILGUN_URL,
});
const MailComposer = require("nodemailer/lib/mail-composer");
interface ISendEmail {
    to: string;
    cc?: string[];
    message: string;
    subject: string;
}

export const sendEmail = ({ to, message, subject, cc }: ISendEmail) => {
    const mailOptions = {
        from: "Rahat Khan Pathan <rahat.khan.pathan@programming-hero.com>",
        to,
        subject,
        text: message,
        message
    };
    var mail = new MailComposer(mailOptions);
    mail.compile().build((err: any, message: any) => {
        if (err) {
            console.log(err);
        }
        const dataToSend = {
            to,
            message: message.toString("ascii"),
        };

        mailgun.messages().sendMime(dataToSend, (sendError: any, body: any) => {
            if (sendError) {
                console.log(sendError);
                return;
            } else {
            //   console.log("email sent");
            }
        });
    });
};
