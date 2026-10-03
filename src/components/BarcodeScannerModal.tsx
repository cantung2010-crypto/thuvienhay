import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, Camera, Barcode, ArrowRight, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode('');
      setCameraError(null);
      hasDetectedRef.current = false;
      return;
    }

    hasDetectedRef.current = false;
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(false);

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Yêu cầu camera môi trường (camera sau trên điện thoại hoặc webcam)
      await codeReader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, err) => {
          if (result && !hasDetectedRef.current) {
            hasDetectedRef.current = true;
            const text = result.getText().trim();
            stopCamera();
            onDetected(text);
          }
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Lỗi mở camera:', err);
      setCameraError('Không thể mở camera. Bạn có thể nhập mã vạch bằng tay ở ô bên dưới.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        // Dừng camera
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch {}
      codeReaderRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    onDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-sm text-gray-900">Quét mã vạch sách</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung Camera Quét */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />

            {/* Khung hướng dẫn đưa mã vạch vào */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-4/5 h-3/5 border-2 border-dashed border-orange-400 rounded-lg relative animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 absolute top-1/2 -translate-y-1/2 shadow-xs" />
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <p className="text-xs">{cameraError}</p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-gray-500">
            Đưa mã vạch ISBN hoặc mã thư viện (LIB-xxxxx) vào trước camera.
          </p>

          {/* Ô nhập mã thủ công hoặc cắm máy quét USB */}
          <div className="border-t pt-3">
            <form onSubmit={handleManualSubmit} className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-700">
                Hoặc nhập mã bằng tay / Dùng máy quét USB:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="VD: 9786042183246 hoặc LIB-83246"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border rounded-lg font-mono focus:outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 shadow"
                >
                  <span>Tìm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
