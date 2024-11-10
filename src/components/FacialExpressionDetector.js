// src/components/FacialExpressionDetector.js

import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FacialExpressionDetector = ({ onExpressionDetected }) => {
  const videoRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const isComponentMountedRef = useRef(true); // Track if component is mounted

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log('Face-api.js models loaded successfully.');
        startVideo();
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error);
          });
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    loadModels();

    return () => {
      // Cleanup when component unmounts
      isComponentMountedRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Stop all video tracks to release the webcam
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      console.error('Video reference is null.');
      return;
    }

    const detectExpressions = async () => {
      if (video.paused || video.ended) {
        console.log('Video not ready for detection.');
        animationFrameIdRef.current = requestAnimationFrame(detectExpressions);
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 512,
              scoreThreshold: 0.5,
            })
          )
          .withFaceExpressions();

        if (detection) {
          const expressions = detection.expressions;
          console.log('Detected expressions:', expressions);

          // Find the emotion with the highest confidence
          const maxValue = Math.max(...Object.values(expressions));
          const emotion = Object.keys(expressions).find(
            (key) => expressions[key] === maxValue
          );

          console.log('Detected emotion:', emotion, 'Confidence:', maxValue);

          if (onExpressionDetected) {
            const score = Math.round(maxValue * 100); // Convert to percentage
            onExpressionDetected(emotion, score);
          }
        } else {
          console.log('No face detected in the frame.');
          if (onExpressionDetected) {
            onExpressionDetected('no_face', 0);
          }
        }
      } catch (error) {
        console.error('Error during expression detection:', error);
        if (onExpressionDetected) {
          onExpressionDetected('error', 0);
        }
      }

      // Continue the detection loop
      if (isComponentMountedRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(detectExpressions);
      }
    };

    // Start the detection loop
    detectExpressions();

    return () => {
      // Cleanup the detection loop when component unmounts
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [onExpressionDetected]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="720"
        height="560"
        style={{ display: 'none' }} // Hide the video element
      />
    </div>
  );
};

export default FacialExpressionDetector;
