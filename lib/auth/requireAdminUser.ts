import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function requireAdminUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  await connectDB();
  const user = await User.findById(authUser.id).select("_id email role status");
  if (!user || user.role !== "admin" || user.status !== "active") {
    return null;
  }

  return {
    id: user._id.toString(),
    email: user.email as string,
  };
}
