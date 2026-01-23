import dotenv from "dotenv";

dotenv.config();

export default function generateEmail(verificationToken: string) {
  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;

  return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bienvenue !</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">
              Merci de t'être inscrit. Pour activer ton compte, clique sur le bouton ci-dessous :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href=${verificationLink} 
                 style="background-color: #4F46E5; 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Vérifier mon email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">
              ${verificationLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              Ce lien expire dans 24 heures.<br>
              Si tu n'as pas créé de compte, ignore cet email.
            </p>
          </div>
        </body>
      </html>
    `;
}
