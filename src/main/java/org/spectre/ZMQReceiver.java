package org.spectre;

import org.zeromq.SocketType;
import org.zeromq.ZMQ;
import org.zeromq.ZContext;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.function.Consumer;

/**
 * Utility class for receiving BufferedImage objects over ZeroMQ
 */
public class ZMQReceiver {
    private final ZContext context;
    private final ZMQ.Socket socket;
    private final String topic;
    private boolean isConnected = false;
    private boolean running = false;
    private Thread listenerThread;

    /**
     * Creates a new ZMQReceiver with default topic
     *
     * @param endpoint the ZeroMQ endpoint to connect to (e.g., "tcp://localhost:5555")
     */
    public ZMQReceiver(String endpoint) {
        this(endpoint, "IMAGE");
    }

    /**
     * Creates a new ZMQReceiver with custom topic
     *
     * @param endpoint the ZeroMQ endpoint to connect to (e.g., "tcp://localhost:5555")
     * @param topic    the topic to subscribe to
     */
    public ZMQReceiver(String endpoint, String topic) {
        this.context = new ZContext();
        this.socket = context.createSocket(SocketType.REP);
        this.topic = topic;

        try {
            // Only bind the REP socket
            this.socket.bind(endpoint);
            this.isConnected = true;
            System.out.println("ZMQReceiver: Bound to " + endpoint);
        } catch (Exception e) {
            System.err.println("Failed to bind to endpoint: " + endpoint);
            e.printStackTrace();
        }
    }

    /**
     * Starts listening for incoming images
     *
     * @param imageConsumer a consumer function that will process received images
     */
    public void startListening(Consumer<BufferedImage> imageConsumer) {
        if (!isConnected) {
            System.err.println("Socket not connected");
            return;
        }

        if (running) {
            System.err.println("Listener is already running");
            return;
        }

        running = true;
        listenerThread = new Thread(() -> {
            System.out.println("ZMQReceiver: Started listening for images on topic: " + topic);

            while (running) {
                try {
                    // First frame is the topic
                    String base64String = socket.recvStr();

                    System.out.println("ZMQReceiver: Received: " + base64String);

//                    if (receivedTopic != null && receivedTopic.equals(topic)) {
                        // Second frame is the image data
//                    byte[] imageBytes = socket.recv();
//                    System.out.println("image Bytes:" + Arrays.toString(imageBytes));

//                    if (imageBytes != null && imageBytes.length > 0) {
                    BufferedImage image = bytesToBufferedImage(base64String.getBytes());
                    System.out.println(image);
                    if (image != null && imageConsumer != null) {
                        imageConsumer.accept(image);
                    }
                } catch (Exception e) {
                    if (running) {
                        System.err.println("Error receiving image");
                        e.printStackTrace();
                    }
                }
            }

            System.out.println("ZMQReceiver: Stopped listening");
        });

        listenerThread.setDaemon(false);
        listenerThread.start();
    }

    /**
     * Stops listening for incoming images
     */
    public void stopListening() {
        running = false;
        if (listenerThread != null) {
            try {
                // Send an interrupt signal
                listenerThread.interrupt();
                // Wait for the thread to terminate
                listenerThread.join(1000);
            } catch (InterruptedException e) {
                System.err.println("Interrupted while stopping listener thread");
            }
            listenerThread = null;
        }
    }

    /**
     * Receives a single image, blocking until one is available
     *
     * @return the received BufferedImage, or null if an error occurred
     */
    public BufferedImage receiveImage() {
        if (!isConnected) {
            System.err.println("Socket not connected");
            return null;
        }

        try {
            // First frame is the topic
            String receivedTopic = socket.recvStr();

            if (receivedTopic != null && receivedTopic.equals(topic)) {
                // Second frame is the image data
                byte[] imageBytes = socket.recv();

                if (imageBytes != null && imageBytes.length > 0) {
                    return bytesToBufferedImage(imageBytes);
                }
            }

            return null;
        } catch (Exception e) {
            System.err.println("Failed to receive image");
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Converts a byte array to a BufferedImage
     *
     * @param bytes the byte array to convert
     * @return the BufferedImage representation of the byte array
     * @throws IOException if the conversion fails
     */
    private BufferedImage bytesToBufferedImage(byte[] bytes) throws IOException {
        ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
        return ImageIO.read(bais);
    }

    /**
     * Closes the ZeroMQ socket and context
     */
    public void close() {
        stopListening();

        if (socket != null) {
            socket.close();
        }
        if (context != null) {
            context.close();
        }
        isConnected = false;
    }
}
