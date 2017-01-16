package co.jp.freemind.fmcp;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.activation.FileTypeMap;

public class FmcpClient {
    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final String fmcpUrl;
    private final TokenGenerator tokenGenerator;

    private FmcpClient(String fmcpUrl, String secretKey, String iv) {
        this.fmcpUrl = fmcpUrl;
        this.tokenGenerator = new TokenGenerator(secretKey, iv);
    }

    public URL getUrl(Parameter param) throws IOException {
        requireNonNull(param);

        try {
            return new URL(fmcpUrl + "?" + URLEncoder.encode(tokenGenerator.getToken(param), "UTF-8"));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    public void put(Parameter param, InputStream file, long contentLength, String contentType) throws IOException {
        requireNonNull(param);
        requireNonNull(file);

        if (contentType == null) {
            contentType = DEFAULT_CONTENT_TYPE;
        }

        HttpURLConnection conn = (HttpURLConnection) getUrl(param).openConnection();
        conn.setDoOutput(true);
        conn.setRequestMethod("PUT");
        conn.setRequestProperty("Content-Type", contentType);
        conn.setRequestProperty("Content-Length", String.valueOf(contentLength));

        OutputStream os = null;
        try {
            os = conn.getOutputStream();
            int available = file.available();
            long readLength = 0;
            byte buffer[] = new byte[available];
            while(true) {
                int size = file.read(buffer, 0, Math.min(available, (int) (contentLength - readLength)));
                if (size <= 0) break;
                os.write(buffer, 0, size);
                readLength += size;
            }
        }
        finally {
            if (os != null) {
                try {
                    os.close();
                } catch (Exception e) {}
            }
        }

        InputStream is = null;
        try {
            is = conn.getInputStream();
            System.out.println(is);
        }
        finally {
            if (is != null) {
                try {
                    is.close();
                } catch (Exception e) {}
            }
        }

    }
    public void put(Parameter param, InputStream file, long size) throws IOException {
        requireNonNull(param);
        requireNonNull(file);

        put(param, file, size, null);
    }
    public void put(Parameter param, File file) throws IOException {
        requireNonNull(param);
        requireNonNull(file);

        FileTypeMap fileTypeMap = FileTypeMap.getDefaultFileTypeMap();
        String contentType = fileTypeMap.getContentType(file);
        InputStream is = null;
        try {
            is = new FileInputStream(file);
            put(param, is, file.length());
        }
        finally {
            if (is != null) {
                try {
                    is.close();
                } catch (Exception e) {}
            }
        }
    }


    private static void requireNonNull(Object obj) {
        if (obj == null) {
            throw new NullPointerException();
        }
    }


    private static final Map<String, Map<String, Map<String, FmcpClient>>> cache = new ConcurrentHashMap<String, Map<String, Map<String, FmcpClient>>>();
    public static FmcpClient getInstance(String fmcpUrl, String secretKey, String iv) {
        requireNonNull(fmcpUrl);
        requireNonNull(secretKey);
        requireNonNull(iv);

        Map<String, FmcpClient> secretKeyMap = ensureSecretKeyMap(fmcpUrl, secretKey);
        FmcpClient client = secretKeyMap.get(iv);
        if (client == null) {
            synchronized (secretKeyMap) {
                client = secretKeyMap.get(iv);
                if (client != null) return client;
                client = new FmcpClient(fmcpUrl, secretKey, iv);
                secretKeyMap.put(iv, client);
            }
        }
        return client;
    }

    private static Map<String, FmcpClient> ensureSecretKeyMap(String fmcpUrl, String secretKey) {
        Map<String, Map<String, FmcpClient>> urlMap = ensureUrlMap(fmcpUrl);
        Map<String, FmcpClient> secretKeyMap = urlMap.get(secretKey);
        if (secretKeyMap == null) {
            synchronized (urlMap) {
                secretKeyMap = urlMap.get(secretKey);
                if (secretKeyMap != null) return secretKeyMap;
                secretKeyMap = new ConcurrentHashMap<String, FmcpClient>();
                urlMap.put(secretKey, secretKeyMap);
            }
        }
        return secretKeyMap;
    }

    private static Map<String, Map<String, FmcpClient>> ensureUrlMap(String fmcpUrl) {
        Map<String, Map<String, FmcpClient>> urlMap = cache.get(fmcpUrl);
        if (urlMap == null) {
            synchronized (cache) {
                urlMap = cache.get(fmcpUrl);
                if (urlMap != null) return urlMap;
                urlMap = new ConcurrentHashMap<String, Map<String, FmcpClient>>();
                cache.put(fmcpUrl, urlMap);
            }
        }
        return urlMap;
    }

}
