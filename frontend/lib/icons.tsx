import {
  File,
  Folder,
  Image,
  Play,
  FileText,
  FileArchive,
  Music,
  FileCode,
} from 'lucide-react'

export const getFileIcon = (fileName: string, isFolder: boolean) => {
  const className = "h-6 w-6 text-primary-600 mr-4"

  if (isFolder) {
    return <Folder className={className} />
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
      return <Image className={className} />
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
    case 'mkv':
      return <Play className={className} />
    case 'pdf':
      return <FileText className={className} />
    case 'doc':
    case 'docx':
      return <FileText className={className} />
    case 'zip':
    case 'rar':
    case '7z':
      return <FileArchive className={className} />
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music className={className} />
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
      return <FileCode className={className} />
    default:
      return <File className="h-6 w-6 text-gray-500 mr-4" />
  }
}