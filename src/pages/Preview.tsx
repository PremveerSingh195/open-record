import React from 'react';
import { RecordingResult, RecordingMode } from '../types/recording';
import { VideoPreview } from '../components/VideoPreview';

interface PreviewPageProps {
  result: RecordingResult;
  mode: RecordingMode;
  onNewRecording: () => void;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({
  result,
  mode,
  onNewRecording,
}) => {
  return (
    <VideoPreview
      result={result}
      mode={mode}
      onNewRecording={onNewRecording}
    />
  );
};
