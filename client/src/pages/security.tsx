import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@heroui/react";
import {
  MdDevices,
  MdDelete,
  MdAdd,
  MdFingerprint,
  MdShield,
} from "react-icons/md";
import { SiWebauthn } from "react-icons/si";

import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/lib/toast";
import { apiClient } from "@/lib/api/client";
import { WebAuthnRegistrationModal } from "@/components/webauthn-registration-modal";

interface WebAuthnCredential {
  id: string;
  name: string;
  created_at: string;
  last_used: string;
  device_type: string;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [showWebAuthnRegistration, setShowWebAuthnRegistration] = useState(false);
  
  // WebAuthn credentials state
  const [webAuthnCredentials, setWebAuthnCredentials] = useState<WebAuthnCredential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Load WebAuthn credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentials = await apiClient.get<WebAuthnCredential[]>("/api/v1/webauthn/credentials");
        setWebAuthnCredentials(credentials);
      } catch (error) {
        console.error("Failed to load WebAuthn credentials:", error);
      } finally {
        setIsLoadingCredentials(false);
      }
    };

    loadCredentials();
  }, []);

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await apiClient.get<ActiveSession[]>("/api/v1/auth/sessions");
        setActiveSessions(sessions);
      } catch (error) {
        console.error("Failed to load active sessions:", error);
        // Mock data for demo
        setActiveSessions([
          {
            id: "1",
            device: "Chrome on macOS",
            location: "San Francisco, CA",
            ip_address: "192.168.1.100",
            last_active: new Date().toISOString(),
            is_current: true,
          },
          {
            id: "2",
            device: "Safari on iPhone",
            location: "San Francisco, CA",
            ip_address: "192.168.1.101",
            last_active: new Date(Date.now() - 3600000).toISOString(),
            is_current: false,
          },
        ]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, []);

  const handleDeleteCredential = async (credentialId: string) => {
    const confirmation = window.confirm(
      "Are you sure you want to remove this WebAuthn credential?"
    );
    
    if (!confirmation) return;

    try {
      await apiClient.delete(`/api/v1/webauthn/credentials/${credentialId}`);
      setWebAuthnCredentials(prev => prev.filter(cred => cred.id !== credentialId));
      toast.success("WebAuthn credential removed successfully");
    } catch (error) {
      console.error("Failed to delete WebAuthn credential:", error);
      toast.error("Failed to remove WebAuthn credential");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const confirmation = window.confirm(
      "Are you sure you want to revoke this session?"
    );
    
    if (!confirmation) return;

    try {
      await apiClient.delete(`/api/v1/auth/sessions/${sessionId}`);
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success("Session revoked successfully");
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    }
  };

  const handleWebAuthnRegistrationSuccess = () => {
    setShowWebAuthnRegistration(false);
    toast.success("WebAuthn credential registered successfully!");
    // Reload credentials
    const loadCredentials = async () => {
      try {
        const credentials = await apiClient.get<WebAuthnCredential[]>("/api/v1/webauthn/credentials");
        setWebAuthnCredentials(credentials);
      } catch (error) {
        console.error("Failed to reload credentials:", error);
      }
    };
    loadCredentials();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center px-4 sm:px-0">
        {/* Header */}
        <div className="w-full max-w-md sm:max-w-none mx-auto mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
              <MdShield className="text-lg text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-default-700">Security</h1>
              <p className="text-small text-default-500">Protect your account with advanced security features</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* WebAuthn Credentials */}
            <Card className="w-full">
              <CardHeader className="pb-3 !flex-row !items-start !justify-between !gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <SiWebauthn className="text-medium text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">WebAuthn Credentials</h2>
                    <p className="text-small text-default-500">Security keys and passkeys for enhanced protection</p>
                  </div>
                </div>
                <Button
                  color="success"
                  size="sm"
                  startContent={<MdAdd className="text-small" />}
                  onPress={() => setShowWebAuthnRegistration(true)}
                  className="shrink-0"
                >
                  Add Credential
                </Button>
              </CardHeader>
              <CardBody className="pt-0">
                {isLoadingCredentials ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner size="md" color="primary" />
                  </div>
                ) : webAuthnCredentials.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table 
                      aria-label="WebAuthn credentials table"
                      classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-medium",
                        td: "text-small",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>CREDENTIAL</TableColumn>
                        <TableColumn className="hidden sm:table-cell">DEVICE TYPE</TableColumn>
                        <TableColumn className="hidden md:table-cell">CREATED</TableColumn>
                        <TableColumn className="hidden md:table-cell">LAST USED</TableColumn>
                        <TableColumn>ACTIONS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {webAuthnCredentials.map((credential) => (
                          <TableRow key={credential.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
                                  <MdFingerprint className="text-small text-secondary" />
                                </div>
                                <div>
                                  <p className="text-medium font-semibold">{credential.name}</p>
                                  <p className="text-tiny text-default-500 sm:hidden">{credential.device_type}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Chip size="sm" variant="flat" color="secondary">
                                {credential.device_type}
                              </Chip>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-default-500 text-tiny">
                              {formatDate(credential.created_at)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-default-500 text-tiny">
                              {formatDate(credential.last_used)}
                            </TableCell>
                            <TableCell>
                              <Button
                                color="danger"
                                size="sm"
                                variant="light"
                                isIconOnly
                                onPress={() => handleDeleteCredential(credential.id)}
                              >
                                <MdDelete className="text-small" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <SiWebauthn className="text-xl text-primary/50" />
                    </div>
                    <p className="text-medium font-semibold text-default-600 mb-2">No credentials registered</p>
                    <p className="text-small text-default-500 mb-4">Add a security key or passkey for enhanced security</p>
                    <Button
                      color="success"
                      variant="bordered"
                      size="sm"
                      startContent={<MdAdd className="text-small" />}
                      onPress={() => setShowWebAuthnRegistration(true)}
                    >
                      Add Your First Credential
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Active Sessions */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
                    <MdDevices className="text-medium text-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Active Sessions</h2>
                    <p className="text-small text-default-500">Monitor and manage your login sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner size="md" color="warning" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table 
                      aria-label="Active sessions table"
                      classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-medium",
                        td: "text-small",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>DEVICE</TableColumn>
                        <TableColumn className="hidden md:table-cell">LOCATION</TableColumn>
                        <TableColumn className="hidden lg:table-cell">IP ADDRESS</TableColumn>
                        <TableColumn className="hidden sm:table-cell">LAST ACTIVE</TableColumn>
                        <TableColumn>ACTIONS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {activeSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
                                  <MdDevices className="text-small text-warning" />
                                </div>
                                <div>
                                  <p className="text-medium font-semibold">{session.device}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {session.is_current && (
                                      <Chip size="sm" color="success" variant="flat">
                                        Current
                                      </Chip>
                                    )}
                                    <p className="text-tiny text-default-500 md:hidden">{session.location}</p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-default-500 text-small">
                              {session.location}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <code className="text-tiny bg-default-100 px-2 py-1 rounded text-default-600">
                                {session.ip_address}
                              </code>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-default-500 text-tiny">
                              {formatDate(session.last_active)}
                            </TableCell>
                            <TableCell>
                              {!session.is_current ? (
                                <Button
                                  color="danger"
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleRevokeSession(session.id)}
                                >
                                  Revoke
                                </Button>
                              ) : (
                                <Chip size="sm" color="success" variant="dot">
                                  Active
                                </Chip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* WebAuthn Registration Modal */}
        <WebAuthnRegistrationModal
          isOpen={showWebAuthnRegistration}
          onClose={() => setShowWebAuthnRegistration(false)}
          onSuccess={handleWebAuthnRegistrationSuccess}
        />
      </section>
    </DefaultLayout>
  );
} 