import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { Modal } from "../../components/Modal";
import jsQR from "jsqr";
import { Text } from "../../components/Text";

type FamilyQRScannerProps = {
  OnClose: (code: string) => void;
};

/**
 * Composition that displays a camera feed to look for QR codes
 */
export const FamilyQRScanner = (props: FamilyQRScannerProps) => {
  const [result, setResult] = createSignal("");
  const [error, setError] = createSignal("");

  let videoRef!: HTMLVideoElement;
  let canvasRef!: HTMLCanvasElement;
  let stream: MediaStream;

  // Begins the video stream and starts the tick every frame
  const startScanning = async () => {
    try {
      // Clear error state
      setError("");

      // Start getting camera stream
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      videoRef.srcObject = stream;
      videoRef.setAttribute("playsinline", "true");

      await videoRef.play();
      requestAnimationFrame(tick);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Camera error: ${err.message}`);
      }
      console.error(err);
    }
  };

  // Tick function will take video date and display it on canvas, and then try to recognize any QR with it
  const tick = () => {
    if (videoRef.readyState === videoRef.HAVE_ENOUGH_DATA) {
      // Ensure canvas matches video dimensions
      if (
        canvasRef.width !== videoRef.videoWidth ||
        canvasRef.height !== videoRef.videoHeight
      ) {
        canvasRef.width = videoRef.videoWidth;
        canvasRef.height = videoRef.videoHeight;
      }

      const canvas = canvasRef.getContext("2d");
      if (canvas) {
        canvas.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);
        const imageData = canvas.getImageData(
          0,
          0,
          canvasRef.width,
          canvasRef.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setResult(code.data);
          // Auto close when code is found
          props.OnClose(code.data);
        }
      }
    }
    requestAnimationFrame(tick);
  };

  // Stops the stream and cleans up
  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  onMount(startScanning);
  onCleanup(stopScanning);

  return (
    <Modal OnClose={() => props.OnClose(result())} Title="Scan Join Code">
      <Show when={error()}>
        <Text FontSize="large">{error()}</Text>
      </Show>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          style={{ width: "100%", "max-height": "60vh", "object-fit": "cover" }}
          playsinline
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            "pointer-events": "none",
            opacity: 0,
          }}
        />
      </div>
    </Modal>
  );
};
