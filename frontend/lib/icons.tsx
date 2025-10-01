
import {
  File,
  Folder,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText as DocumentIcon,
  Archive as ZipIcon,
  Music as AudioIcon,
  FileCode as CodeIcon,
} from 'lucide-react'

export const getFileIcon = (fileName: string, isFolder: boolean) => {
  if (isFolder) {
    return <Folder className="h-5 w-5 text-blue-500 mr-3" />
  }

  const extension = fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return <ImageIcon className="h-5 w-5 text-green-500 mr-3" />
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
    case 'mkv':
      return <VideoIcon className="h-5 w-5 text-purple-500 mr-3" />
    case 'pdf':
      return <DocumentIcon className="h-5 w-5 text-red-500 mr-3" />
    case 'doc':
    case 'docx':
      return <DocumentIcon className="h-5 w-5 text-blue-500 mr-3" />
    case 'zip':
    case 'rar':
    case '7z':
      return <ZipIcon className="h-5 w-5 text-yellow-500 mr-3" />
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <AudioIcon className="h-5 w-5 text-pink-500 mr-3" />
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
      return <CodeIcon className="h-5 w-5 text-indigo-500 mr-3" />
    default:
      return <File className="h-5 w-5 text-gray-400 mr-3" />
  }
}
