import { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { api } from "../../lib/api";

interface AgentResponse {
  message: string;
}

interface DocumentUploadModalProps {
  homeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentUploadModal({
  homeId,
  isOpen,
  onClose,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFile(null);
    setSuccessMessage(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSuccessMessage(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setSuccessMessage(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.upload<AgentResponse>("/agent/document", file, {
        home_id: homeId,
      });
      setSuccessMessage(res.message || "Document uploaded successfully.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Upload a manual, warranty, or instruction document. It will be
          processed for AI-powered search.
        </p>

        {successMessage ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-brand-600" />
                  <p className="text-sm font-medium text-gray-700">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click or drag a file here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, TXT, DOC, DOCX
                    </p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {successMessage ? "Done" : "Cancel"}
          </button>
          {!successMessage && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
