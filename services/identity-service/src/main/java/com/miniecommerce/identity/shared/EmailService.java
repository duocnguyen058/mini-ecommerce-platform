package com.miniecommerce.identity.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:nguyenquangduoc16@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
                    .header { background: #0b74e5; padding: 30px 20px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .body { padding: 30px 25px; color: #333333; line-height: 1.6; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .btn { background-color: #0b74e5; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
                    .link-box { word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 13px; color: #475569; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ShopNow - Xác thực Email</h1>
                    </div>
                    <div class="body">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>ShopNow</strong>. Để hoàn tất đăng ký và bắt đầu mua sắm, vui lòng kích hoạt tài khoản của bạn bằng cách nhấp vào nút bên dưới:</p>
                        
                        <div class="button-container">
                            <a href="%s" class="btn">Xác thực tài khoản ngay</a>
                        </div>
                        
                        <p>Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
                        <div class="link-box">%s</div>
                        
                        <p style="margin-top: 25px; font-size: 13px; color: #64748b;">
                            * Liên kết xác thực này sẽ hết hạn sau 24 giờ.<br>
                            * Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
                        </p>
                    </div>
                    <div class="footer">
                        &copy; 2026 ShopNow E-Commerce Platform. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(fullName, verificationUrl, verificationUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "ShopNow E-Commerce");
            helper.setTo(toEmail);
            helper.setSubject("[ShopNow] Xác thực tài khoản của bạn");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Xác thực email đã gửi thành công tới {}", toEmail);
        } catch (Exception e) {
            log.error("Không thể gửi email xác thực tới {}: {}", toEmail, e.getMessage(), e);
            throw new IllegalArgumentException("Không thể gửi email xác thực đến " + toEmail + ". Mật khẩu ứng dụng (App Password) Gmail không đúng hoặc SMTP bị từ chối.");
        }
    }
}
