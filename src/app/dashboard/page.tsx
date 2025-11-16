"use client";

import AddRecipeForm from "../../components/dashboard/AddRecipeForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"

export default function Dashboard() {

  return (
    <>
      <div className="flex justify-between items-center sticky">
        <h1 className="hidden sm:block text-2xl font-semibold text-secondary">My Recipes</h1>
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/50 transition"
            >
              + Add new recipe
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <AddRecipeForm />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
