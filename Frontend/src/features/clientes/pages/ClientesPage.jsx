import { useState, useMemo } from 'react';
import { UserCircle, CheckCircle, ShoppingBag, DollarSign } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';
import { DataTable } from '../../../shared/components/DataTable';
import { RowActions } from '../../../shared/components/RowActions';
import { ClienteFormModal } from '../components/ClienteFormModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import DetailModal from '../../../shared/components/DetailModal';
import PageHeader from '../../../shared/components/PageHeader';
import { MetricCard } from '../../../shared/components/MetricCard';
import { usePermissions } from '../../../shared/contexts/PermissionContext';
import StatusSwitch from '../../../shared/components/StatusSwitch';
import { CustomSelect } from '../../../shared/components/CustomSelect';
import ErrorBanner from '../../../shared/components/ErrorBanner';
import { exportToPdf } from '../../../shared/utils/exportToPdf';
import { exportToExcel } from '../../../shared/utils/exportToExcel';
import { documentoTexto, nombreTipoDocumento } from '../../../shared/utils/persona';

export default function ClientesPage() {
  const { can } = usePermissions();
  const {
    rawClientes,
    searchQuery,
    setSearchQuery,
    estadoFilter,
    setEstadoFilter,
    showModal,
    setShowModal,
    detailModal,
    setDetailModal,
    deleteDialog,
    setDeleteDialog,
    statusDialog,
    setStatusDialog,
    isDeleting,
    isSaving,
    isUpdatingStatus,
    isLoading,
    loadError,
    refetch,
    handleSave,
    handleDelete,
    handleRequestStatusChange,
    handleConfirmStatusChange,
  } = useClientes();
  const [selectedCliente, setSelectedCliente] = useState(null);

  const totalClientes = rawClientes.length;
  const activos = rawClientes.filter((c) => String(c.estado).toLowerCase() === 'activo').length;
  const totalPedidosHistorico = 0;
  const totalFacturadoHistorico = 0;

  const filteredData = useMemo(() => {
    return rawClientes.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.documento || '').toLowerCase().includes(q) ||
        (c.correo || '').toLowerCase().includes(q) ||
        (c.direccion || '').toLowerCase().includes(q) ||
        (c.telefono || '').toLowerCase().includes(q);

      const isTodos = estadoFilter === 'Todos' || estadoFilter === 'Todos los estados';
      const matchesEstado =
        isTodos || String(c.estado).toLowerCase() === estadoFilter.toLowerCase();

      return matchesSearch && matchesEstado;
    });
  }, [rawClientes, searchQuery, estadoFilter]);

  const columns = useMemo(
    () => [
      {
        key: 'id_cliente',
        label: 'ID',
        render: (value) => <span className="font-mono font-medium">{value}</span>,
      },
      {
        key: 'nombre',
        label: 'Cliente / Razón Social',
        render: (value) => <span className="font-semibold">{value}</span>,
      },
      {
        key: 'documento',
        label: 'Documento',
        render: (value, row) => <span className="text-muted-foreground">{documentoTexto(row.tipo_documento, value)}</span>,
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        render: (value) => <span className="text-muted-foreground">{value}</span>,
      },
      {
        key: 'correo',
        label: 'Correo',
        render: (value) => <span className="text-muted-foreground">{value}</span>,
      },
      {
        key: 'direccion',
        label: 'Dirección',
        render: (value) => <span className="text-muted-foreground">{value}</span>,
      },
      {
        key: 'estado',
        label: 'Estado',
        render: (value, cliente) => (
          <StatusSwitch
            value={value}
            disabled={!can('clientes', 'cambiar_estado')}
            onToggle={() => handleRequestStatusChange(cliente)}
          />
        ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        render: (_, cliente) => (
          <RowActions
            onView={() => setDetailModal({ isOpen: true, data: cliente })}
            onEdit={() => {
              setSelectedCliente(cliente);
              setShowModal(true);
            }}
            editDisabled={!can('clientes', 'editar')}
            onDelete={() => setDeleteDialog({ isOpen: true, id: cliente.id_cliente, nombre: cliente.nombre })}
            deleteDisabled={!can('clientes', 'eliminar')}
          />
        ),
      },
    ],
    [can, setDetailModal, setShowModal, setDeleteDialog, handleRequestStatusChange]
  );

  const handleExportPdf = () => {
    exportToPdf({
      data: filteredData,
      columns: [
        { header: 'ID', key: 'id_cliente' },
        { header: 'Cliente', key: 'nombre' },
        { header: 'Documento', accessor: (c) => documentoTexto(c.tipo_documento, c.documento) },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Correo', key: 'correo' },
        { header: 'Dirección', key: 'direccion' },
        { header: 'Estado', key: 'estado' },
      ],
      title: 'Reporte de Clientes',
      subtitle: 'Directorio y contactos de clientes registrados en CENAREPAS',
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      data: filteredData,
      columns: [
        { header: 'ID', key: 'id_cliente', align: 'center' },
        { header: 'Cliente / Razón Social', key: 'nombre' },
        { header: 'Documento', accessor: (c) => documentoTexto(c.tipo_documento, c.documento), align: 'center' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Correo Electrónico', key: 'correo' },
        { header: 'Dirección', key: 'direccion' },
        { header: 'Estado', key: 'estado', align: 'center' },
        { header: 'Fecha de Creación', key: 'fecha_creacion', align: 'center' },
      ],
      title: 'Reporte de Clientes',
      subtitle: 'Directorio y contactos de clientes registrados en CENAREPAS',
      sheetName: 'Clientes',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Directorio y facturación histórica de clientes de Masarepas"
        addLabel="Nuevo Cliente"
        addDisabled={!can('clientes', 'crear')}
        onAdd={() => {
          setSelectedCliente(null);
          setShowModal(true);
        }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      {/* Tarjetas de Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
        <MetricCard index={0} title="Total Clientes" value={totalClientes} icon={UserCircle} variant="primary" />
        <MetricCard index={1} title="Clientes Activos" value={activos} icon={CheckCircle} variant="success" />
        <MetricCard index={2} title="Pedidos Históricos" value={totalPedidosHistorico} icon={ShoppingBag} variant="accent" />
        <MetricCard index={3} title="Facturación Total" value={`$${totalFacturadoHistorico.toLocaleString('es-CO')}`} icon={DollarSign} variant="warning" />
      </div>

      <ErrorBanner message={loadError} onRetry={refetch} />

      {/* Tabla con DataTable (usa SearchFilterBar y PaginationControls internamente) */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        emptyIcon={UserCircle}
        entityName="clientes"
        onAdd={() => {
          setSelectedCliente(null);
          setShowModal(true);
        }}
        addLabel="Nuevo Cliente"
        addDisabled={!can('clientes', 'crear')}
        isFiltered={Boolean(searchQuery || estadoFilter !== 'Todos')}
        searchPlaceholder="Buscar por código, nombre, NIT o ciudad..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={
          <CustomSelect
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </CustomSelect>
        }
      />

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, data: null })}
        title="Detalle del Cliente"
        fields={detailModal.data ? [
          { label: 'ID', value: detailModal.data.id_cliente },
          { label: 'Tipo de persona', value: detailModal.data.tipo_persona || 'Natural' },
          ...(detailModal.data.tipo_persona === 'Jurídica'
            ? [{ label: 'Razón social', value: detailModal.data.razon_social || detailModal.data.nombre }]
            : [
                { label: 'Nombres', value: detailModal.data.nombres || detailModal.data.nombre },
                { label: 'Apellidos', value: detailModal.data.apellidos || '—' },
              ]),
          { label: 'Tipo de documento', value: nombreTipoDocumento(detailModal.data.tipo_documento) || '—' },
          { label: 'Número de documento', value: detailModal.data.documento },
          { label: 'Teléfono', value: detailModal.data.telefono },
          { label: 'Correo', value: detailModal.data.correo },
          { label: 'Dirección', value: detailModal.data.direccion },
          { label: 'Fecha de Creación', value: detailModal.data.fecha_creacion },
          { label: 'Estado', value: detailModal.data.estado },
        ] : []}
      />

      <ClienteFormModal
        open={showModal}
        cliente={selectedCliente}
        onSave={handleSave}
        isLoading={isSaving}
        onClose={() => {
          setShowModal(false);
          setSelectedCliente(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${deleteDialog.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null, nombre: '' })}
        isLoading={isDeleting}
      />

      {/* Modal de confirmación para Cambio de Estado */}
      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        title={`Cambiar Estado a ${statusDialog.nextEstado}`}
        message={`¿Estás seguro de que deseas cambiar el estado del cliente "${statusDialog.cliente?.nombre}"${
          statusDialog.cliente?.direccion ? ` (${statusDialog.cliente.direccion})` : ''
        } de ${statusDialog.cliente?.estado || 'Activo'} a ${statusDialog.nextEstado}?`}
        confirmText={`Cambiar a ${statusDialog.nextEstado}`}
        confirmVariant={statusDialog.nextEstado === 'Activo' ? 'success' : 'warning'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusDialog({ isOpen: false, cliente: null, nextEstado: 'Activo' })}
        isLoading={isUpdatingStatus}
        loadingText="Cambiando estado…"
      />
    </div>
  );
}