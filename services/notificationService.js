const axios = require('axios');
const dotenv = require('dotenv');
const brevo = require('@getbrevo/brevo');



dotenv.config();


async function sendEmailConfirmation(email) {
   const apiInstance = new brevo.TransactionalEmailsApi();
   apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);


   const sendSmtpEmail = new brevo.SendSmtpEmail();
   sendSmtpEmail.subject = 'Event Registration Confirmation';
   sendSmtpEmail.to = [{ email: email, name: 'Recipient' }];

   sendSmtpEmail.htmlContent = '<html><body><p>Thank you for registering for the event!</p></body></html>';
   sendSmtpEmail.sender = { name:'Alan' , email: 'alanalbertogonzalezgarcia@gmail.com' };

   try {
     const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
     console.log('Email sent successfully:', response);
   } catch (error) {
     console.error('Error sending email:', error);
     throw error;
   }
}

async function sendWhatsAppConfirmation(phoneNumber) {
    const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;  // URL actualizada

    const headers = {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,  // Asegúrate de tener la variable de entorno
      'Content-Type': 'application/json'
    };
  
    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,  // Número de destino (incluye el código de país, ej. 521...)
      type: 'template',
      template: {
        name: 'invitacion',  // El nombre de la plantilla
        language: { code: 'es_MX' }
      }
    };
  
    try {
      const response = await axios.post(url, data, { headers });
      console.log('WhatsApp message sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
      throw error;
    }
}

module.exports= {sendEmailConfirmation,sendWhatsAppConfirmation};