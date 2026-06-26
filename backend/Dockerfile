FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /ion-dex-backend ./cmd/

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai
COPY --from=builder /ion-dex-backend /usr/local/bin/ion-dex-backend
EXPOSE 8080
ENTRYPOINT ["ion-dex-backend"]
