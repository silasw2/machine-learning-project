import { Camera } from "expo-camera";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView } from "react-native";
import * as tf from "@tensorflow/tfjs";
import * as Device from "expo-device";
import * as poseDetection from "@tensorflow-models/pose-detection";

const TensorCamera = cameraWithTensors(Camera);

const initialiseTensorflow = async () => {
  await tf.ready();
  tf.getBackend();
};

let textureDims;
if (Device.manufacturer == "Apple") {
  textureDims = {
    height: 1920,
    width: 1080,
  };
} else {
  textureDims = {
    height: 1200,
    width: 1600,
  };
}

const detectorConfig = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
};

export default function PoseDetection() {
  const [loading, setLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [poses, setPoses] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await initialiseTensorflow();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setCurrentModel(
        await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        )
      );
      setHasCameraPermission(cameraStatus.granted);
      setLoading(false);
    })();
  }, []);

  function handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      if (currentModel) {
        const nextImageTensor = images.next().value;
        if (nextImageTensor) {
          setPoses(await currentModel.estimatePoses(nextImageTensor));
          tf.dispose([nextImageTensor]);
        }
      }

      requestAnimationFrame(loop);
    };
    loop();
  }

  let content;
  if (loading) {
    content = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "black" }}>Loading</Text>
      </View>
    );
  } else if (!hasCameraPermission && !loading) {
    content = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "black" }}>
          Expo does not have Camera Permissions
        </Text>
      </View>
    );
  } else {
    content = (
      <View style={{ width: "100%", height: "100%", backgroundColor: "black" }}>
        {poses
          ? poses.map((pose) => {
              return pose.keypoints.map((keypoint) => {
                return (
                  <View
                    key={keypoint.name}
                    style={{
                      backgroundColor: "red",
                      color: "red",
                      right: keypoint.x,
                      top: keypoint.y,
                      width: 10,
                      height: 10,
                      position: "absolute",
                      zIndex: 999,
                    }}
                  ></View>
                );
              });
            })
          : null}
        <TensorCamera
          // Standard Camera props
          style={{ flex: 1, zIndex: 0 }}
          type={Camera.Constants.Type.back}
          // Tensor related props
          cameraTextureHeight={textureDims.height}
          cameraTextureWidth={textureDims.width}
          resizeHeight={800}
          resizeWidth={410}
          resizeDepth={3}
          onReady={handleCameraStream}
          autorender={true}
        />
      </View>
    );
  }

  return content;
}
