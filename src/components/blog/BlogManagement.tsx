import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  PenLine, Eye, Trash2, MoreVertical, Plus, Loader2, 
  Users, FileText, Send, Save, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { RichTextEditor } from "@/components/shared/RichTextEditor";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  view_count: number;
  author_name?: string;
}

interface BlogPermission {
  id: string;
  user_id: string;
  permission: string;
  full_name: string;
  email: string;
  created_at: string;
}

const BLOG_CATEGORIES = [
  "Training",
  "Nutrition",
  "Mindset",
  "Recovery",
  "Coaching Tips",
  "Client Stories",
  "Industry News",
];

export function BlogManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Check if user is a manager
  const isManager = user?.roles.includes("super_admin");

  // Fetch posts
  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["blog-my-posts"],
    queryFn: () => api.get<BlogPost[]>("/api/blog/my-posts"),
  });

  // Fetch all posts (managers only)
  const { data: allPosts, isLoading: loadingAllPosts } = useQuery({
    queryKey: ["blog-all-posts"],
    queryFn: () => api.get<BlogPost[]>("/api/blog/all-posts"),
    enabled: isManager,
  });

  // Fetch permissions (managers only)
  const { data: permissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ["blog-permissions"],
    queryFn: () => api.get<BlogPermission[]>("/api/blog/permissions"),
    enabled: isManager,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/blog/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-all-posts"] });
      toast.success("Post deleted");
    },
    onError: () => toast.error("Failed to delete post"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <p className="text-muted-foreground">Create and manage blog content</p>
        </div>
        <Button onClick={() => { setEditingPost(null); setShowEditor(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="w-4 h-4" />
            My Posts
          </TabsTrigger>
          {isManager && (
            <>
              <TabsTrigger value="all-posts" className="gap-2">
                <Eye className="w-4 h-4" />
                All Posts
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Users className="w-4 h-4" />
                Permissions
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <PostsTable 
            posts={posts || []} 
            isLoading={loadingPosts}
            onEdit={(post) => { setEditingPost(post); setShowEditor(true); }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="all-posts" className="mt-6">
              <PostsTable 
                posts={allPosts || []} 
                isLoading={loadingAllPosts}
                onEdit={(post) => { setEditingPost(post); setShowEditor(true); }}
                onDelete={(id) => deleteMutation.mutate(id)}
                showAuthor
              />
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
              <PermissionsManager permissions={permissions || []} isLoading={loadingPermissions} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <BlogEditorDialog 
        open={showEditor} 
        onOpenChange={setShowEditor}
        post={editingPost}
      />
    </div>
  );
}

function PostsTable({ 
  posts, 
  isLoading, 
  onEdit, 
  onDelete,
  showAuthor = false 
}: { 
  posts: BlogPost[]; 
  isLoading: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  showAuthor?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No posts yet. Create your first blog post!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              {showAuthor && <TableHead>Author</TableHead>}
              <TableHead>Category</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {post.title}
                </TableCell>
                <TableCell>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                </TableCell>
                {showAuthor && (
                  <TableCell className="text-muted-foreground">
                    {post.author_name || "Unknown"}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {post.category || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {post.view_count}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(post.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(post)}>
                        <PenLine className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {post.status === "published" && (
                        <DropdownMenuItem asChild>
                          <Link to={`/blog/${post.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete(post.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function PermissionsManager({ permissions, isLoading }: { permissions: BlogPermission[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newPermission, setNewPermission] = useState<"write" | "manage">("write");

  const addMutation = useMutation({
    mutationFn: (data: { user_id: string; permission: string }) => 
      api.post("/api/blog/permissions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-permissions"] });
      toast.success("Permission granted");
      setShowAdd(false);
      setNewUserId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add permission"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/blog/permissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-permissions"] });
      toast.success("Permission revoked");
    },
    onError: () => toast.error("Failed to revoke permission"),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blog Permissions</CardTitle>
            <CardDescription>Manage who can write and manage blog content</CardDescription>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Blog Permission</DialogTitle>
                <DialogDescription>
                  Enter the user ID to grant blog access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>User ID</Label>
                  <Input 
                    value={newUserId} 
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label>Permission Level</Label>
                  <Select value={newPermission} onValueChange={(v) => setNewPermission(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="write">Write - Can create and edit own posts</SelectItem>
                      <SelectItem value="manage">Manage - Full access to all posts and permissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button 
                  onClick={() => addMutation.mutate({ user_id: newUserId, permission: newPermission })}
                  disabled={!newUserId || addMutation.isPending}
                >
                  {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Grant Permission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {permissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No blog permissions assigned. Super admins always have full access.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{perm.full_name}</p>
                      <p className="text-xs text-muted-foreground">{perm.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={perm.permission === "manage" ? "default" : "secondary"}>
                      {perm.permission}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(perm.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => revokeMutation.mutate(perm.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function BlogEditorDialog({ open, onOpenChange, post }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Load post data when editing
  useState(() => {
    if (post) {
      setTitle(post.title);
      setCategory(post.category || "");
      setStatus(post.status as any);
      // Would need to fetch full content for editing
    } else {
      setTitle("");
      setContent("");
      setExcerpt("");
      setCategory("");
      setCoverUrl("");
      setStatus("draft");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (post) {
        return api.put(`/api/blog/posts/${post.id}`, data);
      }
      return api.post("/api/blog/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-all-posts"] });
      toast.success(post ? "Post updated!" : "Post created!");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save post"),
  });

  const handleSave = (publishStatus: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    saveMutation.mutate({
      title,
      content,
      excerpt: excerpt || undefined,
      category: category || undefined,
      cover_image_url: coverUrl || undefined,
      status: publishStatus,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Post" : "Create New Post"}</DialogTitle>
          <DialogDescription>
            Write compelling content for your audience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title"
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cover Image URL</Label>
              <Input 
                value={coverUrl} 
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <Label>Excerpt</Label>
            <Textarea 
              value={excerpt} 
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for previews (optional)"
              rows={2}
            />
          </div>

          <div>
            <Label>Content *</Label>
            <RichTextEditor 
              content={content}
              onChange={setContent}
              placeholder="Write your article content here..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="secondary"
            onClick={() => handleSave("draft")}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave("published")}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}