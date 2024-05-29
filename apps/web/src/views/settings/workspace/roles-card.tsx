import { mdiInformation, mdiPlus, mdiTagText, mdiTrashCan, mdiTune } from "@mdi/js";
import { Show, For, Component, createSignal } from "solid-js";
import { CollapsibleSection } from "#components/fragments";
import { Button, Card, Heading, IconButton, Loader, Tooltip } from "#components/primitives";
import { App, hasPermission, useClient, useConfirmationModal, useNotifications } from "#context";

interface RolesCardProps {
  roles: Array<App.ExtendedRole<"baseType">>;
  rolesLoading: boolean;
  editedRoleId: string;
  moreToLoad: boolean;
  openConfigureRoleSubsection(): void;
  setEditedRoleId(id: string): void;
  loadMore(): void;
}

const RoleDetails: Component<{
  role: App.ExtendedRole<"baseType">;
  onDelete?(): void;
  onEdit?(): void;
}> = (props) => {
  const { confirmDelete } = useConfirmationModal();
  const { notify } = useNotifications();
  const client = useClient();
  const [loading, setLoading] = createSignal(false);
  const handleDeleteRole = async (): Promise<void> => {
    setLoading(true);

    try {
      await client.roles.delete.mutate({
        id: props.role.id
      });
      setLoading(false);
      props.onDelete?.();
      notify({
        text: "Role deleted",
        type: "success"
      });
    } catch (error) {
      const clientError = error as App.ClientError;

      setLoading(false);

      let text = "Couldn't delete the role";

      if (clientError.data.cause?.code === "locked") {
        text = "You can't delete a base role";
      }

      notify({
        text,
        type: "error"
      });
    }
  };

  return (
    <Card class="flex flex-col w-full m-0">
      <div class="flex items-center justify-center gap-2 w-full">
        <Heading level={3} class="flex-1">
          {props.role.name || "[No name]"}
        </Heading>
        <Show
          when={!props.role.baseType}
          fallback={
            <Tooltip text="Base role" class="mt-1">
              <IconButton variant="text" class="m-0" path={mdiInformation} text="soft" badge />
            </Tooltip>
          }
        >
          <Show when={hasPermission("manageWorkspace")}>
            <Tooltip text="Edit" class="mt-1">
              <IconButton
                path={mdiTune}
                text="soft"
                disabled={loading()}
                class="m-0"
                onClick={() => {
                  props.onEdit?.();
                }}
              />
            </Tooltip>
            <Tooltip text="Delete" class="mt-1">
              <IconButton
                path={mdiTrashCan}
                text="soft"
                class="m-0"
                loading={loading()}
                onClick={() => {
                  confirmDelete({
                    header: `Delete role (${props.role.name})`,
                    content: (
                      <p>
                        Do you really want to delete this role? All members currently assigned this
                        role will be assigned the the <b>Viewer</b> role.
                      </p>
                    ),
                    onConfirm: handleDeleteRole
                  });
                }}
              />
            </Tooltip>
          </Show>
        </Show>
      </div>
      <Show when={props.role.description}>
        <p class="prose max-w-sm text-gray-500 dark:text-gray-400">{props.role.description}</p>
      </Show>
    </Card>
  );
};
const RolesCard: Component<RolesCardProps> = (props) => {
  return (
    <CollapsibleSection
      icon={mdiTagText}
      label="Roles"
      action={
        <Show when={hasPermission("manageWorkspace")}>
          <Tooltip text="New role" wrapperClass="flex @md:hidden" class="mt-1" fixed>
            <IconButton
              path={mdiPlus}
              class="m-0"
              color="primary"
              onClick={props.openConfigureRoleSubsection}
            />
          </Tooltip>
          <Button
            color="primary"
            class="m-0 hidden @md:flex"
            onClick={props.openConfigureRoleSubsection}
          >
            New role
          </Button>
        </Show>
      }
    >
      <Show
        when={!props.rolesLoading}
        fallback={
          <div class="flex justify-center items-center w-full">
            <Loader />
          </div>
        }
      >
        <For each={props.roles} fallback={<p class="px-2 w-full text-start">No roles found</p>}>
          {(role) => (
            <RoleDetails
              role={role}
              onEdit={() => {
                props.setEditedRoleId(role.id);
                props.openConfigureRoleSubsection();
              }}
            />
          )}
        </For>
        <Show when={props.moreToLoad}>
          <Button
            class="m-0 w-full"
            text="soft"
            loading={props.rolesLoading}
            onClick={() => {
              props.loadMore();
            }}
          >
            Load more
          </Button>
        </Show>
      </Show>
    </CollapsibleSection>
  );
};

export { RolesCard };
