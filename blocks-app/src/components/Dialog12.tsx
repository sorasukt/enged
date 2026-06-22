"use client";

import { Plus, UserRoundIcon, X } from "lucide-react";
import { useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dialog12() {
  const [open, setOpen] = useState(true);
  const [authorName, setAuthorName] = useState("Ephraim Duncan");
  const [title, setTitle] = useState("Design Engineer");
  const [image, setImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMsg(null);
    if (file) {
      if (file.size > 1048576) {
        setErrorMsg("File size exceeds 1MB limit");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900">Open Writer Settings</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 rounded-2xl gap-0 border-zinc-200 dark:border-zinc-850 overflow-hidden bg-white dark:bg-zinc-950">
        <DialogHeader className="border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
          <DialogTitle className="text-balance font-medium text-zinc-900 dark:text-zinc-50">Add a writer</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 px-6 pt-6 pb-6 gap-6">
          <div className="flex flex-col items-center justify-start md:col-span-2">
            <div className="relative mb-2">
              <Avatar className="h-24 w-24 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={image || undefined} alt="Profile" />
                <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900">
                  <UserRoundIcon
                    size={40}
                    className="text-zinc-400 dark:text-zinc-500"
                    aria-hidden="true"
                  />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-0.5 -right-0.5 h-7 w-7 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
                onClick={() => {
                  if (image) {
                    setImage(null);
                    setErrorMsg(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  } else {
                    triggerFileInput();
                  }
                }}
              >
                {image ? (
                  <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                ) : (
                  <Plus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                )}
                <span className="sr-only">
                  {image ? "Remove image" : "Upload image"}
                </span>
              </Button>
            </div>

            <p className="text-pretty text-center font-medium text-sm text-zinc-800 dark:text-zinc-200 mt-2">Upload Image</p>
            <p className="text-pretty text-center text-xs text-zinc-400 dark:text-zinc-500">
              Max file size: 1MB
            </p>
            
            {errorMsg && (
              <p className="text-center text-xs text-red-600 dark:text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded border border-red-100 dark:border-red-900/30">
                {errorMsg}
              </p>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full max-w-[120px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              onClick={triggerFileInput}
            >
              Add Image
            </Button>
          </div>

          <div className="flex flex-col justify-between md:col-span-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="author-name" className="flex items-center text-zinc-700 dark:text-zinc-300">
                  Author name <span className="text-red-500 ml-1 font-bold">*</span>
                </Label>
                <Input
                  id="author-name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300">Title</Label>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
