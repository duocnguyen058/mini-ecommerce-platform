# Multi-stage build cho notification-service.
# Stage 1: build JAR bằng Maven + JDK 25
# Stage 2: chạy JAR bằng JRE 25 nhẹ hơn.

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-25 AS builder

WORKDIR /workspace

# Copy pom trước để Maven cache dependency
COPY services/notification-service/pom.xml ./services/notification-service/pom.xml
COPY pom.xml ./
COPY services/notification-service/src ./services/notification-service/src

# Build skip test
RUN cd services/notification-service && mvn -B -ntp -DskipTests clean package

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:25-jre-alpine AS runtime

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /workspace/services/notification-service/target/*-SNAPSHOT.jar /app/app.jar

RUN addgroup -S spring && adduser -S spring -G spring \
    && chown -R spring:spring /app
USER spring

EXPOSE 8087

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
