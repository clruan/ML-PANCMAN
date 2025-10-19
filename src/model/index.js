import * as tf from "@tensorflow/tfjs";
import { getDefaultStore } from "jotai";
import { stopTrainingAtom, trainingProgressAtom } from "../GlobalState";

const DIRECTION_LABELS = ["up", "down", "left", "right"];
const PACMAN_DIRECTION_MAP = [1, 3, 2, 0];

export async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
  );

  const layer = mobilenet.getLayer("conv_pw_13_relu");
  let truncatedMobileNet = tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output,
  });

  console.info("Truncated MobileNet model has been loaded.");

  return truncatedMobileNet;
}

export async function processImages(imgSrcArr, truncatedMobileNet) {
  let xs = null;
  let ys = null;

  await Promise.all(
    imgSrcArr.map(async (image) => {
      const imgTensor = await base64ToTensor(image.src);
      const embeddings = truncatedMobileNet.predict(imgTensor);

      let labelNum;
      switch (image.label) {
        case "up":
          labelNum = 0;
          break;
        case "down":
          labelNum = 1;
          break;
        case "left":
          labelNum = 2;
          break;
        case "right":
          labelNum = 3;
          break;
      }

      const y = tf.tidy(() => tf.oneHot(tf.tensor1d([labelNum]).toInt(), 4));

      if (xs == null) {
        xs = tf.keep(embeddings);
        ys = tf.keep(y);
      } else {
        const oldX = xs;
        xs = tf.keep(oldX.concat(embeddings, 0));

        const oldY = ys;
        ys = tf.keep(oldY.concat(y, 0));

        oldX.dispose();
        oldY.dispose();
        y.dispose();
      }
    })
  );

  return { xs, ys };
}

function runModelPrediction(truncatedMobileNet, model, imgTensor) {
  return tf.tidy(() => {
    const embeddings = truncatedMobileNet.predict(imgTensor);
    const predictions = model.predict(embeddings);
    const probabilities = Array.from(predictions.dataSync());

    let bestIdx = -1;
    let bestProb = -Infinity;
    probabilities.forEach((prob, idx) => {
      if (prob > bestProb) {
        bestProb = prob;
        bestIdx = idx;
      }
    });

    return {
      probabilities,
      classId: bestIdx,
      confidence: bestIdx >= 0 ? probabilities[bestIdx] : 0,
    };
  });
}

export async function buildModel(
  truncatedMobileNet,
  setLoss,
  controllerDataset,
  hiddenUnits = 100,
  batchSize = 1,
  epochs = 100,
  learningrate = 0.0001
) {
  const model = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While
      // technically a layer, this only performs a reshape (and has no training
      // parameters).
      tf.layers.flatten({
        inputShape: truncatedMobileNet.outputs[0].shape.slice(1),
      }),
      // Layer 1.
      tf.layers.dense({
        units: hiddenUnits,
        activation: "relu",
        kernelInitializer: "varianceScaling",
        useBias: true,
      }),
      // Layer 2. The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: 4,
        kernelInitializer: "varianceScaling",
        useBias: false,
        activation: "softmax",
      }),
    ],
  });

  const optimizer = tf.train.adam(learningrate);
  model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });
  const store = getDefaultStore();

  model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: epochs,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        setLoss(logs.loss.toFixed(5));
      },
      onTrainEnd: async () => {
        store.set(trainingProgressAtom, -1);

        console.log("Training has ended.");
      },
      onEpochEnd: async (epoch, logs) => {
        store.set(
          trainingProgressAtom,
          Math.floor(((epoch + 1) / epochs) * 100)
        );
        if (store.get(stopTrainingAtom)) {
          model.stopTraining = true;
          store.set(stopTrainingAtom, false);
          console.log("Training has been stopped.");
        }
      },
    },
  });

  return model;
}

export async function predict(truncatedMobileNet, model, img) {
  const { classId } = runModelPrediction(truncatedMobileNet, model, img);
  return classId;
}

export async function predictDirection(webcamRef, truncatedMobileNet, model) {
  const result = await predictDirectionWithConfidence(
    webcamRef,
    truncatedMobileNet,
    model
  );

  if (!result) {
    return -1;
  }

  return result.pacmanDirection;
}

export async function predictDirectionWithConfidence(
  webcamRef,
  truncatedMobileNet,
  model
) {
  if (!webcamRef?.current) {
    return null;
  }

  const newImageSrc = webcamRef.current.getScreenshot();
  if (!newImageSrc) {
    return null;
  }

  const imgTensor = await base64ToTensor(newImageSrc);
  const { classId, confidence, probabilities } = runModelPrediction(
    truncatedMobileNet,
    model,
    imgTensor
  );
  tf.dispose(imgTensor);

  if (classId < 0 || classId >= DIRECTION_LABELS.length) {
    return null;
  }

  return {
    directionLabel: DIRECTION_LABELS[classId],
    pacmanDirection: PACMAN_DIRECTION_MAP[classId],
    confidence,
    probabilities,
  };
}

export async function base64ToTensor(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image(224, 224);
    img.crossOrigin = "Anonymous";

    img.onerror = (error) => {
      reject(new Error("Failed to load image: " + error.message));
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let tensor = tf.browser.fromPixels(imageData);
      tensor = tensor.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1.0));
      const expandedTensor = tensor.expandDims(0);

      resolve(expandedTensor);
    };

    // Assign the base64 image source
    img.src = base64;
  });
}
