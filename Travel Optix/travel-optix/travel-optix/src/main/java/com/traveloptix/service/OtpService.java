package com.traveloptix.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@traveloptix.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:Travel Optix}")
    private String fromName;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private static final int OTP_EXPIRY_MINUTES = 10;

    public String generateOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        String otp = String.format("%06d", new Random().nextInt(999999));

        // Always store OTP first
        otpStore.put(normalizedEmail,
                new OtpEntry(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));

        // Then try sending email (never throw)
        try {
            sendOtpEmail(normalizedEmail, otp);
            System.out.println("✅ Brevo OTP email sent to: " + normalizedEmail);
        } catch (Exception e) {
            // Never block registration flow because email failed.
            System.out.println("⚠️ OTP email failed, but OTP is generated anyway.");
            System.out.println("OTP for " + normalizedEmail + " (debug) = " + otp);
            System.out.println("Email error = " + e.getMessage());
            e.printStackTrace();
        }

        // Also print OTP for debugging
        System.out.println("====================================");
        System.out.println("📧 OTP (debug) for " + normalizedEmail + " → " + otp);
        System.out.println("====================================");

        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (email == null) return false;
        String normalizedEmail = email.trim().toLowerCase();

        OtpEntry entry = otpStore.get(normalizedEmail);
        if (entry == null) return false;

        if (LocalDateTime.now().isAfter(entry.expiresAt)) {
            otpStore.remove(normalizedEmail);
            return false;
        }

        if (!entry.otp.equals(otp)) return false;

        otpStore.remove(normalizedEmail); // used -> remove
        return true;
    }

    private void sendOtpEmail(String toEmail, String otp)
            throws MessagingException, java.io.UnsupportedEncodingException {

        if (fromEmail == null || fromEmail.isBlank()) {
            throw new MessagingException("app.mail.from is missing in application.properties");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(toEmail);
        helper.setSubject("Travel Optix — Email Verification");

        String html =
                "<!DOCTYPE html>" +
                        "<html>" +
                        "<body style='font-family: Arial, sans-serif;background:#F9FAFB;margin:0;padding:0;'>" +
                        "<div style='max-width:480px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);'>" +
                        "<div style='background:#1E3A5F;padding:32px;text-align:center;'>" +
                        "<h1 style='color:#FFFFFF;margin:0;font-size:24px;'>Travel Optix</h1>" +
                        "<p style='color:#94A3B8;margin:8px 0 0 0;font-size:14px;'>Email Verification</p>" +
                        "</div>" +
                        "<div style='padding:32px;text-align:center;'>" +
                        "<p style='color:#374151;font-size:16px;margin-bottom:8px;'>Your verification code is</p>" +
                        "<div style='background:#EFF6FF;border-radius:12px;padding:24px;margin:20px 0;'>" +
                        "<span style='font-size:42px;font-weight:bold;color:#2563EB;letter-spacing:12px;'>" +
                        otp +
                        "</span>" +
                        "</div>" +
                        "<p style='color:#6B7280;font-size:14px;'>This code expires in <strong>10 minutes</strong>.</p>" +
                        "<p style='color:#6B7280;font-size:13px;margin-top:16px;'>If you did not request this, you can safely ignore this email.</p>" +
                        "</div>" +
                        "<div style='background:#F3F4F6;padding:16px;text-align:center;'>" +
                        "<p style='color:#9CA3AF;font-size:12px;margin:0;'>© 2026 Travel Optix. All rights reserved.</p>" +
                        "</div>" +
                        "</div>" +
                        "</body>" +
                        "</html>";

        helper.setText(html, true);
        mailSender.send(message);
    }

    private static class OtpEntry {
        final String otp;
        final LocalDateTime expiresAt;

        OtpEntry(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }
}