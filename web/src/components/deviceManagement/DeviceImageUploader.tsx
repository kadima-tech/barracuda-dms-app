import React, { useState } from "react";
import { deviceApi } from "../../utils/api/devices";

// Define the props type
interface DeviceImageUploaderProps {
  deviceId: string;
}

const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  deviceId,
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    try {
      const result = await deviceApi.uploadImages(deviceId, files);
      console.log("Upload successful:", result);
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Images</button>
    </div>
  );
};

export default DeviceImageUploader;
