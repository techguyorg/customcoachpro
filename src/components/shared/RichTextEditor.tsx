import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Upload,
  Loader2,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  const { user } = useAuth();
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setLinkUrl("");
    setShowLinkPopover(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageUrl("");
    setShowImagePopover(false);
  }, [editor, imageUrl]);

  const handleImageUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("You must be logged in to upload images");
      return;
    }
    
    setIsUploading(true);
    try {
      const result = await uploadFile(file, "blog-images", user.id);
      if (result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
        setShowImagePopover(false);
        toast.success("Image uploaded!");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const buttonClass = "h-8 w-8 p-0 hover:bg-muted";
  const activeClass = "bg-muted text-primary";

  return (
    <div className="border-b border-border p-1 flex flex-wrap gap-0.5">
      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonClass} ${editor.isActive("bold") ? activeClass : ""}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonClass} ${editor.isActive("italic") ? activeClass : ""}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${buttonClass} ${editor.isActive("strike") ? activeClass : ""}`}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`${buttonClass} ${editor.isActive("code") ? activeClass : ""}`}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${buttonClass} ${editor.isActive("heading", { level: 1 }) ? activeClass : ""}`}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${buttonClass} ${editor.isActive("heading", { level: 2 }) ? activeClass : ""}`}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${buttonClass} ${editor.isActive("heading", { level: 3 }) ? activeClass : ""}`}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonClass} ${editor.isActive("bulletList") ? activeClass : ""}`}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClass} ${editor.isActive("orderedList") ? activeClass : ""}`}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${buttonClass} ${editor.isActive("blockquote") ? activeClass : ""}`}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={buttonClass}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      {/* Link */}
      <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${buttonClass} ${editor.isActive("link") ? activeClass : ""}`}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setLink()}
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={setLink} className="h-8">
              Add
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass}
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1 text-xs">
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 text-xs">
                <LinkIcon className="w-3 h-3 mr-1" />
                URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <Button
                variant="outline"
                className="w-full h-20 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                  </div>
                )}
              </Button>
            </TabsContent>
            <TabsContent value="url" className="mt-3 space-y-2">
              <Label className="text-xs">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={addImage} className="h-8">
                  Add
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      <div className="w-px bg-border mx-1" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={buttonClass}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={buttonClass}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  // Sync content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={`border border-border rounded-lg overflow-hidden bg-card ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
