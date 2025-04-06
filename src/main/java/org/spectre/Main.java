package org.spectre;

import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.javacpp.IntPointer;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.bytedeco.javacv.OpenCVFrameConverter;
import org.bytedeco.opencv.opencv_core.Mat;

import java.awt.image.BufferedImage;

import static org.bytedeco.opencv.global.opencv_imgcodecs.*;

public class Main {

    private final static String MODEL_PATH = "models/pose/yolov8m-pose.onnx";

    public static final String CLIENT_SOCKET_PATH = "/tmp/client_image_socket";

    private static ZMQSender SENDER;
    private static ZMQReceiver RECEIVER;


    public static void main(String[] args) {
        SENDER = new ZMQSender("tcp://127.0.0.1:5555");
        RECEIVER = new ZMQReceiver("tcp://127.0.0.1:5555");
        Runtime.getRuntime().addShutdownHook(new Thread(Main::shutdown));

        RECEIVER.startListening(image -> {
            System.out.println("Received image: " + image.getWidth() + "x" + image.getHeight());
            // Process the image as needed
        });

    }

    public static void shutdown() {
        SENDER.close();
        RECEIVER.close();
    }


    public static void sendImage(BufferedImage image) {
        image = compressImage(image, "jpg", 50);
        boolean success = SENDER.sendImage(image);
        if (success) {
            System.out.println("Image sent successfully");
        } else {
            System.out.println("Failed to send image");
        }
    }

    // Convert BufferedImage to Mat using JavaCV converters
    public static Mat bufferedImageToMat(BufferedImage bufferedImage) {
        Java2DFrameConverter java2dConverter = new Java2DFrameConverter();
        OpenCVFrameConverter.ToMat matConverter = new OpenCVFrameConverter.ToMat();

// Convert BufferedImage to Frame and then to Mat
        return matConverter.convert(java2dConverter.convert(bufferedImage));
    }

    // Convert Mat to BufferedImage using JavaCV converters
    public static BufferedImage matToBufferedImage(Mat mat) {
        OpenCVFrameConverter.ToMat matConverter = new OpenCVFrameConverter.ToMat();
        Java2DFrameConverter java2dConverter = new Java2DFrameConverter();

// Convert Mat to Frame and then to BufferedImage
        BufferedImage image = java2dConverter.convert(matConverter.convert(mat));
        mat.release();
        return image;
    }

    // Compress a Mat object
    public static Mat compressMat(Mat source, String format, int quality) {
// Set compression parameters
        IntPointer params = new IntPointer(2);
        params.put(0, IMWRITE_JPEG_QUALITY);
        params.put(1, quality); // 0-100 for JPEG (higher = better quality)

// Create a memory buffer for the compressed image
        BytePointer buffer = new BytePointer();
        imencode("." + format, source, buffer, params);

// Decode the compressed image back to a Mat
        return imdecode(new Mat(buffer), IMREAD_UNCHANGED);
    }

    // The main compression method
    public static BufferedImage compressImage(BufferedImage sourceImage, String format, int quality) {
        try {
// Convert BufferedImage to Mat using JavaCV utilities
            Mat sourceMat = bufferedImageToMat(sourceImage);

// Compress the Mat
            Mat compressedMat = compressMat(sourceMat, format, quality);

// Convert back to BufferedImage using JavaCV utilities
            BufferedImage result = matToBufferedImage(compressedMat);

// Release native resources
            sourceMat.close();
            compressedMat.close();

            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}