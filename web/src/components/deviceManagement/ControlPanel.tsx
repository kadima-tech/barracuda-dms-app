import React, { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { deviceApi } from "../../utils/api";
import ScheduleSection from "./ScheduleSection";
import DeviceImageUploader from "./DeviceImageUploader";

const Panel = styled.div`
  padding: 0;
  background: white;
  border-radius: 12px;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
`;

const PanelSection = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #0cbab1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #0a9e96;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
`;

const Title = styled.h3`
  margin: 0;
  color: #334155;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  background-color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 3px rgba(12, 186, 177, 0.1);
    background-color: white;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #0cbab1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #0a9e96;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  margin-top: 0.5rem;

  input[type="checkbox"] {
    appearance: none;
    width: 3rem;
    height: 1.5rem;
    background-color: #e2e8f0;
    border-radius: 1.5rem;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &:checked {
      background-color: #0cbab1;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0.2rem;
      left: 0.2rem;
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 50%;
      background-color: white;
      transition: all 0.3s ease;
    }

    &:checked::after {
      left: calc(100% - 1.3rem);
    }
  }

  span {
    color: #475569;
    font-weight: 500;
    font-size: 0.95rem;
  }
`;

const FileInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f8fafc;

  &:hover {
    border-color: #0cbab1;
    background-color: #f0fffd;
  }

  input[type="file"] {
    display: none;
  }

  svg {
    margin-bottom: 0.75rem;
    color: #94a3b8;
  }

  span {
    color: #334155;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  small {
    color: #64748b;
    font-size: 0.8rem;
  }
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f0fffd;
  border: 1px solid #e2f8f6;
  border-radius: 8px;

  span {
    font-size: 0.9rem;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fee2e2;
  color: #b91c1c;
`;

const SuccessMessage = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #dcfce7;
  color: #15803d;
`;

const InfoMessage = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e0f2fe;
  color: #0369a1;
`;

const QuickLaunchBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const QuickLaunchButton = styled.button`
  padding: 0.5rem 0.75rem;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  &:hover {
    background-color: #e2e8f0;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TabContainer = styled.div`
  border-bottom: 1px solid #f1f5f9;
`;

const TabList = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.25rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${(props) => (props.active ? "#0cbab1" : "#64748b")};
  border-bottom: 2px solid
    ${(props) => (props.active ? "#0cbab1" : "transparent")};
  transition: all 0.2s;

  &:hover {
    color: ${(props) => (props.active ? "#0cbab1" : "#334155")};
  }
`;

const UploadButton = styled(Button)`
  margin-top: 0.5rem;
`;

interface ControlPanelProps {
  deviceId: string;
  deviceName?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  deviceId,
  deviceName,
}) => {
  const [_name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "content" | "media" | "schedule" | "settings"
  >("content");

  // Add state for device rename form
  const [deviceNewName, setDeviceNewName] = useState(deviceName || "");

  // Use refs to prevent unnecessary re-renders
  const previousDeviceIdRef = useRef<string>(deviceId);

  // Preset URLs for quick launch
  const presetUrls = [
    {
      name: "Room Booking",
      url: "http://192.168.2.128:5173/room-booking/booking-dashboard",
    },
    { name: "NOS", url: "https://www.nos.nl" },
    {
      name: "DELA Person Viewer",
      url: "http://192.168.2.128:5173/clients/dela/person-viewer",
    },
    {
      name: "Kiwa Screen",
      url: "https://server.inavv.nl/screen/2ede100c-8e16-11eb-8de9-9600009f9a9c/Kiwa-A001",
    },
    {
      name: "Spotify",
      url: "http://192.168.2.128:5173/spotify",
    },
    {
      name: "BarracudaDMS",
      url: "http://192.168.2.128:5173/public/index.html",
    },
    { name: "Dashboard", url: "http://192.168.2.128:5173/dashboard" },
  ];

  // Use useCallback to memorize function references
  const handleReboot = useCallback(async () => {
    try {
      await deviceApi.sendReboot(deviceId);
      setSuccess("Reboot command sent successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to reboot device:", error);
      setError("Failed to reboot device");
      setTimeout(() => setError(null), 3000);
    }
  }, [deviceId]);

  const handleQuickLaunch = useCallback(
    async (presetUrl: string) => {
      setUrl(presetUrl);

      // Optionally submit the URL immediately
      try {
        await deviceApi.sendUrl(deviceId, presetUrl, active);
        setSuccess("URL sent successfully");

        // Store locally without causing a re-render
        setVideoUrl((prevUrl) => {
          if (prevUrl === presetUrl) {
            return prevUrl; // Return the same reference if URL hasn't changed
          }
          return presetUrl;
        });
      } catch (err) {
        console.error("Failed to send URL to device:", err);
        setError("Failed to send URL to device");
      }
    },
    [deviceId, active]
  );

  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      try {
        await deviceApi.sendUrl(deviceId, url, active);
        setSuccess("URL sent successfully");

        // Store locally without causing a re-render
        setVideoUrl((prevUrl) => {
          if (prevUrl === url) {
            return prevUrl; // Return the same reference if URL hasn't changed
          }
          return url;
        });

        // Clear form
        setName("");
        setUrl("");
        setActive(true);
      } catch (err) {
        console.error("Failed to send URL to device:", err);
        setError("Failed to send URL to device");
      }
    },
    [deviceId, url, active]
  );

  const handleVideoUpload = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!videoFile) {
        setError("Please select a video file");
        return;
      }

      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
      if (videoFile.size > MAX_FILE_SIZE) {
        setError("File is too large. Maximum size is 100MB");
        return;
      }

      setError(null);
      setSuccess(null);
      setUploadStatus("Uploading video...");

      try {
        const response = await deviceApi.uploadVideo(deviceId, videoFile);
        setUploadStatus(null);
        setSuccess("Video uploaded successfully");
        setVideoFile(null);

        // If upload is successful, we automatically send the URL to the device
        const newVideoUrl = response.data.url;
        if (newVideoUrl) {
          // Store locally without causing a re-render if the URL is the same
          setVideoUrl((prevUrl) => {
            if (prevUrl === newVideoUrl) {
              return prevUrl;
            }
            return newVideoUrl;
          });

          try {
            await deviceApi.sendUrl(deviceId, newVideoUrl, true);
            setSuccess("Video uploaded and sent to device");
          } catch (err) {
            console.error("Failed to send video URL to device:", err);
            setError("Video uploaded but failed to send to device");
          }
        }
      } catch (err) {
        console.error("Failed to upload video:", err);
        setUploadStatus(null);
        setError("Failed to upload video");
      }
    },
    [deviceId, videoFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setVideoFile(files[0]);
      }
    },
    []
  );

  // Use useCallback for tab switching to prevent unnecessary renders
  const handleTabSwitch = useCallback(
    (tab: "content" | "media" | "schedule" | "settings") => {
      setActiveTab(tab);
    },
    []
  );

  // Add rename device function
  const handleRenameDevice = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!deviceNewName.trim()) {
        setError("Device name cannot be empty");
        return;
      }

      try {
        await deviceApi.renameDevice(deviceId, deviceNewName);
        setSuccess("Device renamed successfully");

        // Ideally we would want to update the UI with the new name
        // This could be done via props or context depending on your app's structure
      } catch (err) {
        console.error("Failed to rename device:", err);
        setError("Failed to rename device");
      }
    },
    [deviceId, deviceNewName]
  );

  // Check if device ID has changed and reset state if needed
  if (deviceId !== previousDeviceIdRef.current) {
    previousDeviceIdRef.current = deviceId;
    // Reset states when device changes
    setVideoUrl(null);
    setError(null);
    setSuccess(null);
    setUploadStatus(null);
  }

  return (
    <Panel>
      <TabContainer>
        <TabList>
          <Tab
            active={activeTab === "content"}
            onClick={() => handleTabSwitch("content")}
          >
            Content
          </Tab>
          <Tab
            active={activeTab === "media"}
            onClick={() => handleTabSwitch("media")}
          >
            Media
          </Tab>
          <Tab
            active={activeTab === "schedule"}
            onClick={() => handleTabSwitch("schedule")}
          >
            Schedule
          </Tab>
          <Tab
            active={activeTab === "settings"}
            onClick={() => handleTabSwitch("settings")}
          >
            Settings
          </Tab>
        </TabList>
      </TabContainer>

      {activeTab === "content" && (
        <>
          <PanelSection>
            <SectionHeader>
              <Title>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12H19M12 5V19"
                    stroke="#0cbab1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Quick Actions
              </Title>
            </SectionHeader>
            <ActionButton onClick={handleReboot}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3M3 12H9M3 12L5.5 9.5M3 12L5.5 14.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reboot Device
            </ActionButton>
          </PanelSection>

          <PanelSection>
            <SectionHeader>
              <Title>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 10.5L21 3M16 3H21V8M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H12"
                    stroke="#0cbab1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Content URL
              </Title>
            </SectionHeader>

            <QuickLaunchBar>
              {presetUrls.map((preset, index) => (
                <QuickLaunchButton
                  key={index}
                  onClick={() => handleQuickLaunch(preset.url)}
                  title={preset.url}
                >
                  {preset.name}
                </QuickLaunchButton>
              ))}
            </QuickLaunchBar>

            <Form onSubmit={handleUrlSubmit}>
              <FormGroup>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </FormGroup>

              <Toggle>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>Active</span>
              </Toggle>

              {error && (
                <ErrorMessage>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9V13M12 17H12.01M8.46447 4.46447C9.40215 3.52678 10.6739 3 12 3C13.3261 3 14.5979 3.52678 15.5355 4.46447C16.4732 5.40215 17 6.67392 17 8V16C17 17.3261 16.4732 18.5979 15.5355 19.5355C14.5979 20.4732 13.3261 21 12 21C10.6739 21 9.40215 20.4732 8.46447 19.5355C7.52678 18.5979 7 17.3261 7 16V8C7 6.67392 7.52678 5.40215 8.46447 4.46447Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {error}
                </ErrorMessage>
              )}

              {success && (
                <SuccessMessage>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {success}
                </SuccessMessage>
              )}

              <Button type="submit">Submit</Button>
            </Form>
          </PanelSection>
        </>
      )}

      {activeTab === "media" && (
        <>
          <PanelSection>
            <SectionHeader>
              <Title>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 10L19.5528 7.72361C19.8343 7.58281 20 7.30177 20 7V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V7C4 7.30177 4.16571 7.58281 4.44721 7.72361L9 10M15 10L9 10M15 10L15 20H9L9 10"
                    stroke="#0cbab1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Upload Video
              </Title>
            </SectionHeader>
            <Form onSubmit={handleVideoUpload}>
              <FileInputWrapper>
                {!videoFile ? (
                  <FileInputLabel>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 16L8.58579 11.4142C9.36684 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Select Video File (Max 100MB)</span>
                    <small>Click or drag and drop</small>
                  </FileInputLabel>
                ) : (
                  <SelectedFile>
                    <span>{videoFile.name}</span>
                    <Button
                      type="button"
                      onClick={() => setVideoFile(null)}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    >
                      Change
                    </Button>
                  </SelectedFile>
                )}
              </FileInputWrapper>

              {uploadStatus && (
                <InfoMessage>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {uploadStatus}
                </InfoMessage>
              )}

              {error && (
                <ErrorMessage>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9V13M12 17H12.01M8.46447 4.46447C9.40215 3.52678 10.6739 3 12 3C13.3261 3 14.5979 3.52678 15.5355 4.46447C16.4732 5.40215 17 6.67392 17 8V16C17 17.3261 16.4732 18.5979 15.5355 19.5355C14.5979 20.4732 13.3261 21 12 21C10.6739 21 9.40215 20.4732 8.46447 19.5355C7.52678 18.5979 7 17.3261 7 16V8C7 6.67392 7.52678 5.40215 8.46447 4.46447Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {error}
                </ErrorMessage>
              )}

              {success && (
                <SuccessMessage>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {success}
                </SuccessMessage>
              )}

              <UploadButton type="submit" disabled={!videoFile}>
                Upload & Display
              </UploadButton>
            </Form>
          </PanelSection>

          <PanelSection>
            <SectionHeader>
              <Title>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 16L8.58579 11.4142C9.36684 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                    stroke="#0cbab1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Upload Images
              </Title>
            </SectionHeader>
            <DeviceImageUploader deviceId={deviceId} />
          </PanelSection>
        </>
      )}

      {activeTab === "schedule" && (
        <PanelSection>
          <ScheduleSection deviceId={deviceId} videoUrl={videoUrl || ""} />
        </PanelSection>
      )}

      {activeTab === "settings" && (
        <PanelSection>
          <SectionHeader>
            <Title>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.7389 4.5808 13.8642 4.82578 14.0407 5.032C14.2172 5.23822 14.4399 5.39985 14.6907 5.50375C14.9414 5.60764 15.2132 5.65085 15.4838 5.62987C15.7544 5.60889 16.0162 5.5243 16.248 5.383C17.791 4.443 19.558 6.209 18.618 7.753C18.4769 7.98466 18.3924 8.24634 18.3715 8.51677C18.3506 8.78721 18.3938 9.05877 18.4975 9.30938C18.6013 9.55999 18.7627 9.78258 18.9687 9.95905C19.1747 10.1355 19.4194 10.2609 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C19.4192 13.7389 19.1742 13.8642 18.968 14.0407C18.7618 14.2172 18.6001 14.4399 18.4963 14.6907C18.3924 14.9414 18.3491 15.2132 18.3701 15.4838C18.3911 15.7544 18.4757 16.0162 18.617 16.248C19.557 17.791 17.791 19.558 16.247 18.618C16.0153 18.4769 15.7537 18.3924 15.4832 18.3715C15.2128 18.3506 14.9412 18.3938 14.6906 18.4975C14.44 18.6013 14.2174 18.7627 14.0409 18.9687C13.8645 19.1747 13.7391 19.4194 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.2611 19.4192 10.1358 19.1742 9.95929 18.968C9.7828 18.7618 9.56011 18.6001 9.30935 18.4963C9.05859 18.3924 8.78683 18.3491 8.51621 18.3701C8.24559 18.3911 7.98375 18.4757 7.752 18.617C6.209 19.557 4.442 17.791 5.382 16.247C5.5231 16.0153 5.60755 15.7537 5.62848 15.4832C5.64942 15.2128 5.60624 14.9412 5.50247 14.6906C5.3987 14.44 5.23726 14.2174 5.03127 14.0409C4.82529 13.8645 4.58056 13.7391 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C4.5808 10.2611 4.82578 10.1358 5.032 9.95929C5.23822 9.7828 5.39985 9.56011 5.50375 9.30935C5.60764 9.05859 5.65085 8.78683 5.62987 8.51621C5.60889 8.24559 5.5243 7.98375 5.383 7.752C4.443 6.209 6.209 4.442 7.753 5.382C8.753 5.99 10.049 5.452 10.325 4.317Z"
                  stroke="#0cbab1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="#0cbab1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Device Settings
            </Title>
          </SectionHeader>

          <Form onSubmit={handleRenameDevice}>
            <FormGroup>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                type="text"
                value={deviceNewName}
                onChange={(e) => setDeviceNewName(e.target.value)}
                placeholder="Enter device name"
                required
              />
            </FormGroup>

            {error && (
              <ErrorMessage>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9V13M12 17H12.01M8.46447 4.46447C9.40215 3.52678 10.6739 3 12 3C13.3261 3 14.5979 3.52678 15.5355 4.46447C16.4732 5.40215 17 6.67392 17 8V16C17 17.3261 16.4732 18.5979 15.5355 19.5355C14.5979 20.4732 13.3261 21 12 21C10.6739 21 9.40215 20.4732 8.46447 19.5355C7.52678 18.5979 7 17.3261 7 16V8C7 6.67392 7.52678 5.40215 8.46447 4.46447Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {error}
              </ErrorMessage>
            )}

            {success && (
              <SuccessMessage>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {success}
              </SuccessMessage>
            )}

            <Button type="submit">Rename Device</Button>
          </Form>
        </PanelSection>
      )}
    </Panel>
  );
};

export default React.memo(ControlPanel);
