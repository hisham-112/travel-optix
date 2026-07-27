package com.traveloptix.security;

import com.traveloptix.model.User;
import com.traveloptix.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("========================================");
        System.out.println("JWT FILTER: " + request.getMethod() + " " + request.getRequestURI());

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("JWT FILTER: No valid Authorization header");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String email;

        try {
            email = jwtUtil.extractEmail(token);
            System.out.println("JWT FILTER: Email extracted = " + email);
        } catch (Exception e) {
            System.out.println("JWT FILTER: Token extraction failed: " + e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                System.out.println("JWT FILTER: User not found in DB");
                filterChain.doFilter(request, response);
                return;
            }

            User user = userOptional.get();

            boolean valid = jwtUtil.validateToken(token, user.getEmail());

            if (!valid) {
                System.out.println("JWT FILTER: Token invalid");
                filterChain.doFilter(request, response);
                return;
            }

            // ✅ Authorities now come directly from User.getAuthorities()
            //    No need to manually build them here anymore
            System.out.println("JWT FILTER: Role from DB = '" + user.getRole() + "'");
            System.out.println("JWT FILTER: Authorities = " + user.getAuthorities());

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            user.getAuthorities()  // ✅ pulled from User directly
                    );

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);

            System.out.println("JWT FILTER: Authentication successfully set for " + email);
        }

        System.out.println("JWT FILTER: Final auth = "
                + SecurityContextHolder.getContext().getAuthentication());
        System.out.println("========================================");

        filterChain.doFilter(request, response);
    }
}