package co.jp.freemind.fmcp;

import java.lang.reflect.Method;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class TokenGenerator {
    private static final String ALGORITHM = "AES";
    private static final String MODE = "CBC";
    private static final String PADDING = "PKCS5Padding";
    private static final String TRANSFORM = ALGORITHM + "/" + MODE + "/" + PADDING;

    private final Cipher cipher;

    public TokenGenerator(String secretKey, String iv) {
        IvParameterSpec ivParameterSpec = new IvParameterSpec(iv.getBytes());
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), ALGORITHM);
        try {
            this.cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String getToken(Parameter param) {
        String src = param.toJson();
        System.out.println(src);
        byte[] bytes;
        synchronized (cipher) {
            try {
                bytes = cipher.doFinal(src.getBytes());
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return encode(bytes);
    }

    private String encode(byte[] bytes) {
        try {
            Class<?> base64Class = Class.forName("java.util.Base64");
            Method getEncoder = base64Class.getMethod("getEncoder");
            Object encoder = getEncoder.invoke(null);
            Method encode = encoder.getClass().getMethod("encode", byte[].class);
            Object result = encode.invoke(encoder, new Object[]{bytes});
            return new String((byte[]) result);
        } catch (Exception e1) {
            e1.printStackTrace();

            try {
                Object encoder = Class.forName("sun.misc.BASE64Encoder").newInstance();
                Method encode = encoder.getClass().getMethod("encode", byte[].class);
                Object result = encode.invoke(encoder, new Object[]{bytes});
                return (String) result;
            } catch (Exception e2) {
                e2.printStackTrace();
                throw new RuntimeException(e2);
            }
        }
    }
}
