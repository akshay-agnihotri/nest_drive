"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { loginUserWithOtp, sendOtp } from "@/lib/actions/user.action";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const OtpModal = ({
  userId,
  showOtpModal,
  setShowOtpModal,
  email,
}: {
  userId: string | null;
  showOtpModal: boolean;
  setShowOtpModal: React.Dispatch<React.SetStateAction<boolean>>;
  email: string | null;
}) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Function to handle OTP resend
  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMessage("");

    if (!userId) {
      setErrorMessage("User ID is not available.");
      setIsLoading(false);
      return;
    }

    try {
      // Call your server action to resend the OTP
      await sendOtp(email!); // Ensure email is not null
      setErrorMessage("OTP has been resent to your email.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stop the form from reloading the page
    setIsLoading(true);
    setErrorMessage("");

    // 1. Validate that we have the necessary data although this block never runs
    if (!userId || otp.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit code.");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Call your server action to verify the code and log in
      const res = await loginUserWithOtp(userId, otp);

      // 3. If successful, you can redirect the user or update the UI accordingly
      if (res.success) router.push("/");
    } catch (error) {
      // 4. If the server action throws an error (e.g., wrong OTP), display it

      if (error instanceof Error) {
        const errorMsg =
          error.message === "Invalid token passed in the request."
            ? "Please enter a valid 6-digit code."
            : error.message;
        setErrorMessage(errorMsg);
      }
    } finally {
      // 5. Stop the loading indicator
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
      <DialogContent className="shad-alert-dialog">
        <DialogHeader className="relative flex justify-center">
          <DialogTitle className="h2 text-center">
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="subtitle-2 text-center text-light-100">
            Enter the 6-digit code sent to your email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup className="shad-otp">
              <InputOTPSlot index={0} className="shad-otp-slot" />
              <InputOTPSlot index={1} className="shad-otp-slot" />
              <InputOTPSlot index={2} className="shad-otp-slot" />
              <InputOTPSlot index={3} className="shad-otp-slot" />
              <InputOTPSlot index={4} className="shad-otp-slot" />
              <InputOTPSlot index={5} className="shad-otp-slot" />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            className="shad-submit-btn h-12"
            disabled={isLoading || otp.length !== 6}
          >
            Verify Code
            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={20}
                height={20}
                className="ml-2 animate-spin"
              />
            )}
          </Button>
          <div className="subtitle-2 mt-2 text-center text-light-100">
            Didn&apos;t get the code?
            <Button
              variant="link"
              className="text-brand font-medium"
              onClick={handleResendOtp}
              disabled={isLoading}
            >
              Resend OTP
            </Button>
          </div>
          {/* Display error message if any */}
          {errorMessage && (
            <p className="text-sm text-error text-center">*{errorMessage}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OtpModal;
