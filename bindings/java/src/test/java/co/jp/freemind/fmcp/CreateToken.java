package co.jp.freemind.fmcp;

public class CreateToken {
    private static final String secretKey = "abcdefghijklmnop";
    private static final String iv = "1234567890123456";

    public static void main(String[] args) {
        TokenGenerator generator = new TokenGenerator(secretKey, iv);

        Parameter param = Parameter.builder()
                .url("http://www.freemind.co.jp/reading-farm/4_0_0.jpg")
                .method("GET")
                .build();
        String token = generator.getToken(param);
        System.out.println(token);
    }
}
