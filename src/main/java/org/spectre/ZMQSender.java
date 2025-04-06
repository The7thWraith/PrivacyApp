package org.spectre;

import org.zeromq.SocketType;
import org.zeromq.ZMQ;
import org.zeromq.ZContext;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Utility class for sending BufferedImage objects over ZeroMQ
 */
public class ZMQSender {
    private final ZContext context;
    private final ZMQ.Socket socket;
    private final String topic;
    private final String imageFormat;
    private boolean isConnected = false;

    /**
     * Creates a new ImageZMQSender with default topic and image format
     *
     * @param endpoint the ZeroMQ endpoint to connect to (e.g., "tcp://*:5555")
     */
    public ZMQSender(String endpoint) {
        this(endpoint, "IMAGE", "jpg");
    }

    /**
     * Creates a new ImageZMQSender with custom topic and image format
     *
     * @param endpoint    the ZeroMQ endpoint to connect to (e.g., "tcp://*:5555")
     * @param topic       the topic to publish images on
     * @param imageFormat the image format to use (jpg, png, etc.)
     */
    public ZMQSender(String endpoint, String topic, String imageFormat) {
        this.context = new ZContext();
        this.socket = context.createSocket(SocketType.PUB);
        this.topic = topic;
        this.imageFormat = imageFormat;

        try {
            this.socket.connect(endpoint);
            this.isConnected = true;
        } catch (Exception e) {
            System.err.println("Failed to bind to endpoint: " + endpoint);
            e.printStackTrace();
        }
    }

    /**
     * Sends a BufferedImage over ZeroMQ
     *
     * @param image the BufferedImage to send
     * @return true if the image was sent successfully, false otherwise
     */
    public boolean sendImage(BufferedImage image) {
        if (!isConnected) {
            System.err.println("Socket not connected");
            return false;
        }

        try {
// Convert BufferedImage to byte array
            byte[] imageBytes = bufferedImageToBytes(image, imageFormat);

// Publish the image bytes with the topic
            socket.sendMore(topic);// Topic
            socket.send(imageBytes); // Content

            return true;
        } catch (IOException e) {
            System.err.println("Failed to send image");
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Converts a BufferedImage to a byte array
     *
     * @param image  the BufferedImage to convert
     * @param format the image format to use (jpg, png, etc.)
     * @return the byte array representation of the image
     * @throws IOException if the conversion fails
     */
    private byte[] bufferedImageToBytes(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }

    /**
     * Closes the ZeroMQ socket and context
     */
    public void close() {
        if (socket != null) {
            socket.close();
        }
        if (context != null) {
            context.close();
        }
        isConnected = false;
    }

}