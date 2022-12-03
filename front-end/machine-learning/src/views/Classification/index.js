import { Camera } from "expo-camera";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView } from "react-native";
import * as tf from "@tensorflow/tfjs";
import * as Device from "expo-device";
import * as MobileNet from "@tensorflow-models/mobilenet";

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

export default function Classification() {
  const [loading, setLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await initialiseTensorflow();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setCurrentModel(await MobileNet.load());
      setHasCameraPermission(cameraStatus.granted);
      setLoading(false);
    })();
  }, []);

  function handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      if (currentModel) {
        const nextImageTensor = images.next().value;
        if (nextImageTensor) {
          await currentModel
            .classify(nextImageTensor)
            .then((classifications) => {
              let probabilityArray = classifications.map((classification) => {
                return classification.probability
              });
              if (probabilityArray.some((val) => {return val > 0.2})) {
                setPredictions(classifications);
              }
            });
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
      <>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <TensorCamera
            // Standard Camera props
            style={{ flex: 1 }}
            type={Camera.Constants.Type.back}
            // Tensor related props
            cameraTextureHeight={textureDims.height}
            cameraTextureWidth={textureDims.width}
            resizeHeight={128}
            resizeWidth={128}
            resizeDepth={3}
            onReady={handleCameraStream}
            autorender={true}
          />
          <SafeAreaView
            style={{
              position: "absolute",
              zIndex: 100,
              right: 5,
              top: 5,
              width: "35%",
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                backgroundColor: "white",
                borderRadius: 15,
                padding: 5,
                alignItems: "center",
              }}
            >
              <Text>Detections:</Text>
              {predictions.map((prediction) => {
                if (prediction.probability > 0.2) {
                  return <Text>{prediction.className}</Text>;
                }
              })}
            </View>
          </SafeAreaView>
        </View>
      </>
    );
  }

  return content;
}
