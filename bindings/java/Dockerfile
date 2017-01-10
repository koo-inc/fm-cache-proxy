FROM java:6-jdk

ENV GRADLE_HOME=/usr/bin/gradle-2.9 \
    PATH=$PATH:/usr/bin/gradle-2.9/bin

WORKDIR /usr/bin
RUN wget -q https://services.gradle.org/distributions/gradle-2.9-bin.zip -O gradle.zip \
    && unzip -q gradle.zip \
    && rm gradle.zip

VOLUME /build
WORKDIR /build

CMD ["gradle", "clean", "build", "bintrayUpload"]
