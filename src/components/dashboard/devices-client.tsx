"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import type { Device } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";
import { Smartphone } from "lucide-react";


const formSchema = z.object({
  deviceId: z.string().min(1, {
    message: "Device ID cannot be empty.",
  }),
  name: z.string().min(1, {
    message: "Device name cannot be empty.",
  }),
});

export function DevicesClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      name: "",
    },
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "users", user.uid, "devices"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const devicesData: Device[] = [];
      querySnapshot.forEach((doc) => {
        devicesData.push({ id: doc.id, ...doc.data() } as Device);
      });
      setDevices(devicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "devices"), {
        deviceId: values.deviceId,
        name: values.name,
        userId: user.uid,
        createdAt: Date.now(),
      });
      toast({
        title: "Success",
        description: "Device added successfully.",
      });
      form.reset();
    } catch (error) {
      console.error("Error adding device: ", error);
      toast({
        title: "Error",
        description: "Could not add device. Please try again.",
        variant: "destructive",
      });
    }
  }

  const renderLoadingRows = () => {
    return Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={`loading-${i}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      </TableRow>
    ));
  };
  
  const isValidDate = (timestamp: any) => {
    return timestamp && !isNaN(new Date(timestamp).getTime());
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle>Add New Device</CardTitle>
                    <CardDescription>Register a new device to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. My Smart Wallet" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deviceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter the unique ID of your device" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Adding..." : "Add Device"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Registered Devices
            </CardTitle>
             <CardDescription>
              A list of all your registered devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Date Added</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? renderLoadingRows() : (
                        devices.length > 0 ? devices.map((device) => (
                            <TableRow key={device.id}>
                                <TableCell className="font-medium">{device.name}</TableCell>
                                <TableCell>{device.deviceId}</TableCell>
                                <TableCell>
                                    {isValidDate(device.createdAt) ? format(new Date(device.createdAt), "MMM d, yyyy") : 'N/A'}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No devices found.
                                </TableCell>
                            </TableRow>
                        )
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}