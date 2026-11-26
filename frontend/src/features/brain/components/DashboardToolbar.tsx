import { Button, Group, Stack, Text, TextInput, ThemeIcon } from "@mantine/core";
import { IconBrain, IconSearch } from "@tabler/icons-react";

interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function DashboardToolbar({ searchQuery, onSearchChange }: DashboardToolbarProps) {
  return (
    <Group justify="space-between" mb="xl">
      <Stack gap="xs">
        <Group gap="sm">
          <ThemeIcon size="lg" variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
            <IconBrain size={24} />
          </ThemeIcon>
          <Text size="xl" fw={700}>
            Sesi Brainstorming
          </Text>
        </Group>
        <Text c="dimmed">Kelola proyek penelitian dan diskusi dengan AI assistant</Text>
      </Stack>

      <Group gap="md">
        <TextInput
          placeholder="Cari proyek..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          style={{ width: 300 }}
        />
        <Button
          leftSection={<IconSearch size={16} />}
          variant="light"
          onClick={() => {
            const searchInput = document.querySelector(
              'input[placeholder="Cari proyek..."]'
            ) as HTMLInputElement | null;
            searchInput?.focus();
          }}
        >
          Cari Proyek
        </Button>
      </Group>
    </Group>
  );
}
