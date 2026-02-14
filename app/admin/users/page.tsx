"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Calendar, Loader2, MoreHorizontal } from "lucide-react";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/all-users").then(res => res.json()).then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">User Details</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Joined</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((u) => (
            <tr key={u._id} className="hover:bg-slate-50/30 transition-colors">
              <td className="px-8 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  {u.name?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </td>
              <td className="px-8 py-5">
                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase border ${
                  u.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  u.role === 'seller' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="px-8 py-5 text-xs font-bold text-slate-400">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="px-8 py-5 text-right">
                 <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreHorizontal size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}