import { PrismaClient } from '@prisma/client';

export const seedPermissions = async (
  prisma: PrismaClient,
  adminPositionId: number,
  memberPositionId: number,
  districtManagementPositionId : number,
  placeManagementPositionId : number
) => {
  console.log('🔐 Seeding permissions...');

  const permissionsData = [
    // User Management
    { name: 'VIEW_USER', resource: 'USER', action: 'VIEW', description: 'View user information' },
    { name: 'ADD_USER', resource: 'USER', action: 'ADD', description: 'Create new user' },
    { name: 'UPDATE_USER', resource: 'USER', action: 'UPDATE', description: 'Update user information' },
    { name: 'DELETE_USER', resource: 'USER', action: 'DELETE', description: 'Delete user' },
    { name: 'MANAGE_USER_PERMISSION', resource: 'USER', action: 'MANAGE_PERMISSION', description: 'Assign or revoke user permissions' },
    { name: 'CHANGE_USER_POSITION', resource: 'USER', action: 'CHANGE_POSITION', description: 'Change user position/role' },

    // Position Management
    { name: 'VIEW_POSITION', resource: 'POSITION', action: 'VIEW', description: 'View position information' },
    { name: 'ADD_POSITION', resource: 'POSITION', action: 'ADD', description: 'Create new position' },
    { name: 'UPDATE_POSITION', resource: 'POSITION', action: 'UPDATE', description: 'Update position information' },
    { name: 'DELETE_POSITION', resource: 'POSITION', action: 'DELETE', description: 'Delete position' },

    // Permission Management
    { name: 'VIEW_PERMISSION', resource: 'PERMISSION', action: 'VIEW', description: 'View permission information' },
    { name: 'ADD_PERMISSION', resource: 'PERMISSION', action: 'ADD', description: 'Create new permission' },
    { name: 'UPDATE_PERMISSION', resource: 'PERMISSION', action: 'UPDATE', description: 'Update permission information' },
    { name: 'DELETE_PERMISSION', resource: 'PERMISSION', action: 'DELETE', description: 'Delete permission' },

    // District Management
    { name: 'VIEW_DISTRICT', resource: 'DISTRICT', action: 'VIEW', description: 'View district information' },
    { name: 'ADD_DISTRICT', resource: 'DISTRICT', action: 'ADD', description: 'Create new district' },
    { name: 'UPDATE_DISTRICT', resource: 'DISTRICT', action: 'UPDATE', description: 'Update district information' },
    { name: 'DELETE_DISTRICT', resource: 'DISTRICT', action: 'DELETE', description: 'Delete district' },

    // Place Management
    { name: 'VIEW_PLACE', resource: 'PLACE', action: 'VIEW', description: 'View place information' },
    { name: 'ADD_PLACE', resource: 'PLACE', action: 'ADD', description: 'Create new place' },
    { name: 'UPDATE_PLACE', resource: 'PLACE', action: 'UPDATE', description: 'Update place information' },
    { name: 'DELETE_PLACE', resource: 'PLACE', action: 'DELETE', description: 'Delete place' },

    // Layer Management
    { name: 'VIEW_LAYER', resource: 'LAYER', action: 'VIEW', description: 'View layer information' },
    { name: 'ADD_LAYER', resource: 'LAYER', action: 'ADD', description: 'Create new layer' },
    { name: 'UPDATE_LAYER', resource: 'LAYER', action: 'UPDATE', description: 'Update layer information' },
    { name: 'DELETE_LAYER', resource: 'LAYER', action: 'DELETE', description: 'Delete layer' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((permission) =>
      prisma.permission.create({ data: permission }),
    ),
  );

  console.log(`✅ ${permissions.length} permissions seeded`);

  // ============================================
  // Assign Permissions to Positions
  // ============================================
  console.log('🔗 Assigning permissions to positions...');

  // Admin gets all permissions
  const adminPermissions = permissions.map((permission) => ({
    position_id: adminPositionId,
    permission_id: permission.id,
  }));

  await prisma.positionPermission.createMany({
    data: adminPermissions,
  });

  // District Management

  const districtManagementPermissions = permissions.filter((p) => p.resource === 'DISTRICT');
  if (districtManagementPermissions.length) {
    await prisma.positionPermission.createMany({
      data: districtManagementPermissions.map((permission) => ({
        position_id: districtManagementPositionId,
        permission_id: permission.id,
      })),
    });
  }

  // Place Management
  const placeManagementPermissions = permissions.filter((p) => p.resource ==='PLACE');
  if(placeManagementPermissions){
    await prisma.positionPermission.createMany({
      data : placeManagementPermissions.map((permissions) => ({
        position_id : placeManagementPositionId,
        permission_id : permissions.id
      }))
    })
  }

  // Member gets only VIEW_USER permission
  const viewUserPermission = permissions.find((p) => p.name === 'VIEW_USER');
  if (viewUserPermission) {
    await prisma.positionPermission.create({
      data: {
        position_id: memberPositionId,
        permission_id: viewUserPermission.id,
      },
    });
  }

  const districtManagementPermission = permissions

  console.log('✅ Permissions assigned to positions');
};
