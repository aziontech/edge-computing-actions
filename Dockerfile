FROM alpine:3.16

RUN apk add curl jq git

RUN curl -L https://downloads.azion.com/linux/x86_64/azioncli-0.50.0 > azioncli

RUN chmod +x azioncli

RUN cp azioncli /usr/local/bin

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]