import { Card, Center, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="lg"
      withBorder
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: "#ddd",
        height: "100%",
        minHeight: 280,
      }}
      onClick={onClick}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.borderColor = "#4c6ef5";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.borderColor = "#ddd";
      }}
    >
      <Center h="100%">
        <Stack align="center" gap="md">
          <ThemeIcon size={48} variant="light" color="blue" radius="xl">
            <IconPlus size={24} />
          </ThemeIcon>
          <Text size="lg" fw={500} ta="center">
            Buat Sesi Brainstorming Baru
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Mulai proyek penelitian baru dengan AI assistant
          </Text>
        </Stack>
      </Center>
    </Card>
  );
}
