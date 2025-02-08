const axios = require('axios');
const dotenv = require('dotenv');
const brevo = require('@getbrevo/brevo');



dotenv.config();


async function sendEmailConfirmation(email) {
   const apiInstance = new brevo.TransactionalEmailsApi();
   apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);


   const sendSmtpEmail = new brevo.SendSmtpEmail();
   sendSmtpEmail.subject = 'Confirmacion de asistencia XV Años Natalia';
   sendSmtpEmail.to = [{ email: email, name: 'Recipient' }];

   sendSmtpEmail.htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>.button:hover {background-color:#c0392b}</style>
</head>
<body style='color:#444; font-family:"Helvetica Neue", Helvetica, Arial, sans-serif; line-height:1.6; margin:0; padding:0'>
    <div class="container" style="background-color:#f8f9fa; border-radius:10px; box-shadow:0 2px 10px rgba(0, 0, 0, 0.1); margin:20px auto; max-width:600px; padding:40px" bgcolor="#f8f9fa">
        <div class="header" style="border-bottom:2px solid #eee; margin-bottom:30px; padding-bottom:30px; text-align:center" align="center">
            <img src="https://www.misxvnatalia.com/assets/vestidoIA1-C4P1fIur.png" alt="Logo XV Años" class="logo" style="margin-bottom:20px; max-width:200px">
            <h1 style="color: #2c3e50; margin: 10px 0;">¡Confirmación Exitosa!</h1>
        </div>

        <div class="content" style="color:#555; font-size:16px; margin-bottom:30px">
            <p style="text-align: center; font-size: 18px;">
                Gracias por confirmar tu asistencia.<br>
                Estamos emocionados de compartir este momento especial contigo.
            </p>

            <div class="date" style="color:#2c3e50; font-size:20px; font-weight:bold; margin:25px 0; text-align:center" align="center">
                26 de Abril del 2025<br>
                <span style="font-size: 16px; font-weight: normal;">¡No faltes!</span>
            </div>

            <p style="text-align: center;">
                <a href="https://www.misxvnatalia.com/" class="button" style="background-color:#e74c3c; border-radius:25px; display:inline-block; margin:20px 0; padding:12px 30px; text-decoration:none; transition:background-color 0.3s; color:white" bgcolor="#e74c3c">
                    Ver detalles del evento
                </a>
            </p>

    </div>
</div>
</body>
</html>`;
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
        name: `${process.env.WHATSAPP_TEMPLATE_NAME}`,  // El nombre de la plantilla
        language: { code: 'es' }
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