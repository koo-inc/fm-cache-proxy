package co.jp.freemind.fmcp;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
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
        private String method = "GET";
        private Map<String, String> headers = new HashMap<String, String>();
        private Map<String, String> body = new HashMap<String, String>();
        private Map<String, String> query = new HashMap<String, String>();

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
        public Builder query(String key, String value) {
            this.query.put(key, value);
            return this;
        }
        public Parameter build() {
            if (url == null) {
                throw new IllegalStateException("url is required.");
            }
            StringBuilder urlBuilder = new StringBuilder(url);
            if (url.contains("?")) {
                if (!url.endsWith("&") && !url.endsWith("?")) {
                    urlBuilder.append('&');
                }
            }
            else {
                urlBuilder.append('?');
            }
            for (Map.Entry<String, String> e : query.entrySet()) {
                urlBuilder.append(encode(e.getKey())).append('=');
                if (e.getValue() != null) {
                    urlBuilder.append(e.getValue());
                }
                urlBuilder.append('&');
            }
            urlBuilder.delete(urlBuilder.length() - 1, urlBuilder.length());
            return new Parameter(urlBuilder.toString(), method, headers, body);
        }

        private String encode(String str) {
            try {
                return URLEncoder.encode(str, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
