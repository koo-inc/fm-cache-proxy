package co.jp.freemind.fmcp;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class Parameter {
    @JsonProperty("url")
    private final String url;
    @JsonProperty("method")
    private final String method;
    @JsonProperty("headers")
    private final Map<String, String> headers;
    @JsonProperty("body")
    private final Map<String, String> body;
    @JsonProperty("_")
    private Long timestamp;

    private static final ObjectMapper mapper = new ObjectMapper();

    private Parameter(String url, String method, Map<String, String> headers, Map<String, String> body) {
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.body = body;
    }

    String toJson() {
        this.timestamp = System.currentTimeMillis();
        try {
            return mapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public String toString() {
        return this.toJson();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Builder() {}

        private String url;
        private String method;
        private Map<String, String> headers = new HashMap<String, String>();
        private Map<String, String> body = new HashMap<String, String>();

        public Builder url(String url) {
            this.url = url;
            return this;
        }
        public Builder method(String method) {
            this.method = method;
            return this;
        }
        public Builder header(String key, String value) {
            this.headers.put(key, value);
            return this;
        }
        public Builder body(String key, String value) {
            this.body.put(key, value);
            return this;
        }
        public Parameter build() {
            return new Parameter(url, method, headers, body);
        }
    }
}
