package co.jp.freemind.fmcp;

import java.io.File;
import java.io.IOException;
import java.net.URL;

public class PutFile {
    private static final String secretKey = "abcdefghijklmnop";
    private static final String iv = "1234567890123456";
    private static final String fmcpUrl = "http://localhost:3000/";

    public static void main(String[] args) throws IOException {
        URL resource = Thread.currentThread().getContextClassLoader().getResource("test.png");
        File file = new File(resource.getFile());

        Parameter param = Parameter.builder()
                .url("http://www.freemind.co.jp/common/images/dot01.gif")
                .method("GET")
                .build();

        FmcpClient client = new FmcpClient(fmcpUrl, secretKey, iv);
        client.put(param, file);

        System.out.println(client.getUrl(param));
    }
}
