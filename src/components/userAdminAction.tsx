"use client";

import { 
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

type EmailVerificationProps = {
  userId: string;
  verify: boolean;
  setVerify: (verify: boolean) => void;
}

export const ToggleEmailVerification = ({
    userId,
    verify,
    setVerify,
  }: EmailVerificationProps) => {
  
  const verifyToggle = async () => {
    fetch(`/api/users/verify-email?userId=${userId}&verify=${!verify}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to verify email: ${res.status}`);
      }
      setVerify(!verify);
    })
    .catch((error) => {
      console.error("Error verifying email:", error);
    });
  };

  return (
    <DialogContent className="w-fit pr-14">
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        This will {verify ? "mark the email as unverified" : "mark the email as verified"}.
        Are you sure you want to continue?
      </DialogDescription>
      <DialogFooter className="justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={verifyToggle}>
            Yes, {verify ? "unverify" : "verify"} email
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );

}

type ToggleBanProps = {
  userId: string;
  banned: boolean;
  setBanned: (banned: boolean) => void;
}

export const ToggleBanUser = ({ userId, banned, setBanned }: ToggleBanProps) => {
  const toggleBan = async () => {
    try {
      const res = await fetch("/api/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, banned: !banned }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update ban status: ${res.status}`);
      }
      setBanned(!banned);
    } catch (error) {
      console.error("Error updating ban status:", error);
    }
  };

  return (
    <DialogContent className="w-fit pr-14">
      <DialogHeader>
        <DialogTitle>{banned ? "Unban user" : "Ban user"}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        {banned
          ? "This user will regain access immediately. Continue?"
          : "The user will be prevented from signing in. Continue?"}
      </DialogDescription>
      <DialogFooter className="justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            variant={banned ? "default" : "destructive"}
            onClick={() => {
              void toggleBan();
            }}
          >
            {banned ? "Yes, unban" : "Yes, ban"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

type DeleteUserProps = {
  userId: string;
  onDeleted: () => void;
}

export const DeleteUserDialog = ({ userId, onDeleted }: DeleteUserProps) => {
  const softDelete = async () => {
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        throw new Error(`Failed to delete user: ${res.status}`);
      }
      onDeleted();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <DialogContent className="w-fit pr-14">
      <DialogHeader>
        <DialogTitle>Delete user</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        This will permanently remove the account and any associated sessions.
        Are you sure you want to continue?
      </DialogDescription>
      <DialogFooter className="justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            variant="destructive"
            onClick={() => {
              void softDelete();
            }}
          >
            Yes, delete user
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}