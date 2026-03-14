import { Select } from "./ui/select";
import { useRoiStore } from "../store/useRoiStore";
import { useFilters } from "../hooks/useRoiData";

export function FilterBar() {
  const {
    app,
    country,
    bidType,
    installChannel,
    setApp,
    setCountry,
    setBidType,
    setInstallChannel,
  } = useRoiStore();
  const { data: filters } = useFilters();

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="用户安装渠道"
        value={installChannel}
        options={filters?.install_channels ?? []}
        onChange={setInstallChannel}
      />
      <Select
        label="出价类型"
        value={bidType}
        options={filters?.bid_types ?? []}
        onChange={setBidType}
      />
      <Select
        label="国家地区"
        value={country}
        options={filters?.countries ?? []}
        onChange={setCountry}
      />
      <Select
        label="APP"
        value={app}
        options={filters?.apps ?? []}
        onChange={setApp}
      />
    </div>
  );
}
