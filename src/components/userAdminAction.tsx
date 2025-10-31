"use client";

import { 
  DialogClose,
  DialogContent,
  DialogDescription,
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
        <DialogClose asChild>
          <Button onClick={verifyToggle}>
            Yes, {verify ? "unverify" : "verify"} email
          </Button>
        </DialogClose>
      </DialogDescription>
    </DialogContent>
  );

}